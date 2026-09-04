import Fastify from 'fastify'
const servidor = Fastify()
// Rota de Health Check (Verificação de saúde da API)
servidor.get('/', () => {
 return 'Olá! A API está funcionando corretamente.'
})
servidor.listen({ port: 3000})
