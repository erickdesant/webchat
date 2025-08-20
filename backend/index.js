import express from "express"
import cors from "cors"
import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())


const internetPlans = {
  basic: {
    name: "Plano Básico",
    speed: "100 Mbps",
    price: "R$ 79,90/mês",
    features: ["Wi-Fi grátis", "Instalação gratuita", "Suporte 24h"],
    ideal: "navegação básica, redes sociais, e-mail"
  },
  standard: {
    name: "Plano Padrão", 
    speed: "300 Mbps",
    price: "R$ 99,90/mês",
    features: ["Wi-Fi grátis", "Instalação gratuita", "Suporte 24h", "Netflix incluso"],
    ideal: "streaming, home office, jogos online"
  },
  premium: {
    name: "Plano Premium",
    speed: "600 Mbps", 
    price: "R$ 149,90/mês",
    features: ["Wi-Fi grátis", "Instalação gratuita", "Suporte 24h", "Netflix + Prime Video", "Técnico prioritário"],
    ideal: "múltiplos usuários, streaming 4K, trabalho pesado"
  },
  ultra: {
    name: "Plano Ultra",
    speed: "1 Giga",
    price: "R$ 199,90/mês", 
    features: ["Wi-Fi 6 grátis", "Instalação gratuita", "Suporte 24h", "Todos streamings inclusos", "Técnico prioritário", "IP fixo"],
    ideal: "empresas, gamers profissionais, streaming em alta qualidade"
  }
}


const salesSystemPrompt = `Você é um assistente de vendas especializado em planos de internet da empresa "ConectaFast". Seu objetivo é:

1. CUMPRIMENTAR o cliente de forma calorosa e profissional
2. DESCOBRIR as necessidades do cliente perguntando sobre:
   - Quantas pessoas usam a internet em casa
   - Para que usam (trabalho, streaming, jogos, etc.)
   - Se trabalham home office
   - Problemas com internet atual
3. RECOMENDAR o plano ideal baseado nas necessidades
4. APRESENTAR os planos disponíveis com detalhes
5. COLETAR informações de contato para finalizar a venda

PLANOS DISPONÍVEIS:
- Básico: 100 Mbps - R$ 79,90/mês (navegação básica)
- Padrão: 300 Mbps - R$ 99,90/mês + Netflix (streaming, home office)
- Premium: 600 Mbps - R$ 149,90/mês + Netflix + Prime (múltiplos usuários)
- Ultra: 1 Giga - R$ 199,90/mês + todos streamings (empresas, gamers)

REGRAS:
- Seja amigável, consultivo e não insistente
- Faça perguntas uma de cada vez
- Explique os benefícios, não só as características
- Quando apresentar planos, mostre qual é mais adequado
- Ao coletar contato, peça: nome completo, telefone, e-mail, endereço
- Use emojis ocasionalmente para ser mais amigável
- Mantenha respostas concisas mas informativas

Comece sempre cumprimentando o cliente e se apresentando.`


const apiKey = process.env.GOOGLE_API_KEY
let model = null

if (apiKey) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    
    } catch (err) {
        console.error(" Erro com IA:", err.message)
    }
}

const conversations = new Map()

function getConversation(sessionId) {
    if (!conversations.has(sessionId)) {
        conversations.set(sessionId, {
            messages: [],
            customerInfo: {},
            stage: 'greeting', 
            isFirstMessage: true
        })
    }
    return conversations.get(sessionId)
}


app.post("/chat", async (req, res) => {
    try {
        const { message, sessionId = 'default' } = req.body
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: "Mensagem é obrigatória" })
        }

        const conversation = getConversation(sessionId)
        console.log(`💬 [${sessionId}] User: ${message}`)
        
        if (!model) {
            return res.json({ 
                reply: "Olá! Sou o assistente da ConectaFast! Infelizmente estou com problemas técnicos no momento. Tente novamente em alguns minutos. 😊" 
            })
        }

        
        let prompt = ""
        if (conversation.isFirstMessage) {
            prompt = `${salesSystemPrompt}\n\nO cliente acabou de chegar. Cumprimente-o e se apresente como assistente da ConectaFast.`
            conversation.isFirstMessage = false
        } else {
            
            const conversationHistory = conversation.messages
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n')
            
            prompt = `${salesSystemPrompt}\n\nHistórico da conversa:\n${conversationHistory}\n\nCliente: ${message}\n\nResponda de forma natural e consultiva:`
        }

    
        const result = await model.generateContent(prompt)
        const reply = result.response.text()

        
        conversation.messages.push({ role: "Cliente", content: message })
        conversation.messages.push({ role: "Assistente", content: reply })

        if (conversation.messages.length > 20) {
            conversation.messages = conversation.messages.slice(-20)
        }

        console.log(`🤖 [${sessionId}] Bot: ${reply.substring(0, 100)}...`)
        
        res.json({ 
            reply,
            sessionId,
            stage: conversation.stage
        })

    } catch (err) {
        console.error("Erro de chat:", err)
        res.status(500).json({ 
            error: "Ops! Tive um problema técnico. Pode tentar novamente?" 
        })
    }
})


app.get("/plans", (req, res) => {
    res.json({ plans: internetPlans })
})


app.post("/clear", (req, res) => {
    const { sessionId = 'default' } = req.body
    conversations.delete(sessionId)
    res.json({ message: "Conversa limpa. Vou me apresentar novamente!" })
})

app.listen(PORT, () => {
    console.log(` ConectaFast Sales Bot rodando em http://localhost:${PORT}`)
    
    if (!apiKey) {
        console.log("Chave de API incorreta")
    }
})