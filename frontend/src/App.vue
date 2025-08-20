<script setup>
import { ref, onMounted, nextTick, watch } from "vue";

const messages = ref([])
const newMessage = ref("")
const isLoading = ref(false)
const sessionId = ref('session-' + Math.random().toString(36).substr(2, 9))
const messagesEndRef = ref(null)


onMounted(() => {
  sendGreeting()
})

const sendGreeting = async () => {
  isLoading.value = true
  try {
    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Olá", sessionId: sessionId.value })
    })
    const data = await response.json()
    if (response.ok) {
      messages.value = [{
        sender: "ConectaFast",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString(),
        isBot: true
      }]
    }
  } catch (error) {
    messages.value = [{
      sender: "ConectaFast",
      text: "Olá! Bem-vindo à ConectaFast! 🌐 Sou seu assistente virtual. Como posso ajudá-lo hoje?",
      timestamp: new Date().toLocaleTimeString(),
      isBot: true
    }]
  } finally {
    isLoading.value = false
  }
}

const sendMessage = async () => {
  if (newMessage.value.trim() && !isLoading.value) {
    const userMessage = newMessage.value.trim()
    messages.value.push({ sender: "Você", text: userMessage, timestamp: new Date().toLocaleTimeString(), isBot: false })
    newMessage.value = ""
    isLoading.value = true
    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId: sessionId.value })
      })
      const data = await response.json()
      if (response.ok) {
        messages.value.push({ sender: "ConectaFast", text: data.reply, timestamp: new Date().toLocaleTimeString(), isBot: true })
      } else {
        messages.value.push({ sender: "Sistema", text: "Erro: " + (data.error || "Algo deu errado"), timestamp: new Date().toLocaleTimeString(), isError: true })
      }
    } catch (error) {
      messages.value.push({ sender: "Sistema", text: "Não foi possível conectar com o servidor.", timestamp: new Date().toLocaleTimeString(), isError: true })
    } finally {
      isLoading.value = false
    }
  }
}

const clearChat = async () => {
  try {
    await fetch('http://localhost:5000/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sessionId.value }) })
    messages.value = []
    sendGreeting()
  } catch (error) {
    console.error('Erro ao limpar:', error)
  }
}

const handleKeyPress = (e) => {
  if (e.key === 'Enter') sendMessage()
}
</script>

<template>
  <div class="app">
    <div class="chat-container">
      
      <div class="chat-header">
        <div class="header-left">
          <div class="logo">C</div>
          <div>
            <h1>ConectaFast</h1>
            <p>Assistente Virtual de Vendas</p>
          </div>
        </div>
        <button class="new-chat-btn" @click="clearChat">Nova Conversa</button>
      </div>

      
      <div class="chat-messages">
        <div 
          v-for="(message, index) in messages" 
          :key="index" 
          :class="['message-wrapper', message.isBot ? 'left' : 'right']"
        >
          <div :class="['message', message.isBot ? 'bot' : message.isError ? 'error' : 'user']">
            <div class="message-meta">
              <span class="sender">{{ message.sender }}</span>
              <span class="timestamp">{{ message.timestamp }}</span>
            </div>
            <p>{{ message.text }}</p>
          </div>
        </div>

        
        <div v-if="isLoading" class="message-wrapper left">
          <div class="message bot">
            <span>ConectaFast está digitando</span>
            <div class="dots">
              <div class="dot"></div>
              <div class="dot" style="animation-delay:0.1s"></div>
              <div class="dot" style="animation-delay:0.2s"></div>
            </div>
          </div>
        </div>

        <div ref="messagesEndRef"></div>
      </div>

      
      <div class="chat-input">
        <input v-model="newMessage" @keypress="handleKeyPress" :disabled="isLoading" placeholder="Digite sua mensagem..." />
        <button @click="sendMessage" :disabled="isLoading || !newMessage.trim()">{{ isLoading ? 'Enviando...' : 'Enviar' }}</button>
      </div>

      
      <div class="plans">
        <h2>Nossos Planos de Internet</h2>
        <div class="plans-grid">
          <div class="plan">
            <h3>Básico</h3>
            <p class="speed">100 Mbps</p>
            <p class="price">R$ 79,90/mês</p>
          </div>
          <div class="plan">
            <h3>Padrão</h3>
            <p class="speed">300 Mbps</p>
            <p class="price">R$ 99,90/mês</p>
          </div>
          <div class="plan highlight">
            <h3>Premium</h3>
            <p class="speed">600 Mbps</p>
            <p class="price">R$ 149,90/mês</p>
            <span class="tag">Mais Popular</span>
          </div>
          <div class="plan">
            <h3>Ultra</h3>
            <p class="speed">1 Giga</p>
            <p class="price">R$ 199,90/mês</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #ebf4ff, #e0e7ff);
  padding: 1rem;
}
.chat-container {
  max-width: 1000px;
  margin: auto;
}
.chat-header {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem 1rem 0 0;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(to right, #2563eb, #4f46e5);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 20px;
}
.chat-header h1 {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  color: #1f2937;
}
.chat-header p {
  color: #6b7280;
  font-size: 14px;
}
.new-chat-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}
.new-chat-btn:hover {
  background: #e5e7eb;
}

.chat-messages {
  background: white;
  height: 24rem;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.message-wrapper {
  display: flex;
}
.message-wrapper.right {
  justify-content: flex-end;
}
.message {
  max-width: 300px;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
}
.message.bot {
  background: linear-gradient(to right, #3b82f6, #4f46e5);
  color: white;
}
.message.user {
  background: #f3f4f6;
  color: #1f2937;
}
.message.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.message-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}
.sender {
  font-weight: bold;
}
.timestamp {
  opacity: 0.7;
}
.chat-input {
  background: white;
  padding: 1.5rem;
  border-radius: 0 0 1rem 1rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
}
.chat-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 9999px;
  border: 1px solid #d1d5db;
}
.chat-input input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}
.chat-input button {
  background: linear-gradient(to right, #2563eb, #4f46e5);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
.chat-input button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
.dots {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #bfdbfe;
  animation: bounce 2s infinite;
}
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-8px); }
  70% { transform: translateY(-4px); }
  90% { transform: translateY(-1px); }
}
.plans {
  margin-top: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
}
.plans h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 1rem;
}
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(200px,1fr));
  gap: 1rem;
}
.plan {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}
.plan:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.plan.highlight {
  background: linear-gradient(to right, #fef3c7, #fff7ed);
}
.plan .tag {
  background: #ffedd5;
  color: #c2410c;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 9999px;
}
.plan h3 {
  color: #2563eb;
}
.plan.highlight h3 {
  color: #ea580c;
}
.plan .speed {
  font-size: 20px;
  font-weight: bold;
}
.plan .price {
  color: #16a34a;
  font-weight: bold;
}
</style>
