
import Fastify from 'fastify'
import { Pool } from 'pg'
import cors from '@fastify/cors'

const sql = new Pool({
    user: "postgres",
    password: "senai",
    host: "localhost",
    port: 5432,
    database: "escritorio_odontologico1.0"
})

const servidor = Fastify()

servidor.register(cors, {
    origin: '*'
})

// ==================================================
// HEALTH CHECK
// ==================================================

servidor.get('/', async () => {
    return 'Olá! A API do consultório está funcionando.'
})


// ==================================================
// LOGIN
// ==================================================

servidor.post('/login', async (request, reply) => {
    const body = request.body

    if (!body || !body.email || !body.senha) {
        return reply.status(400).send({
            message: "email e senha obrigatórios"
        })
    }

    const resultado = await sql.query(`
        SELECT id, nome, email, 'cliente' AS tipo
        FROM cliente
        WHERE email = $1 AND senha = $2

        UNION ALL

        SELECT id, nome, email, 'dentista' AS tipo
        FROM dentista
        WHERE email = $1 AND senha = $2
    `, [body.email, body.senha])

    if (resultado.rows.length === 0) {
        return reply.status(401).send({
            message: "Usuário ou senha inválidos",
            login: false
        })
    }

    return reply.status(200).send({
        message: "Login realizado com sucesso",
        login: true,
        usuario: resultado.rows[0]
    })
})


// ==================================================
// DENTISTAS - LISTAR
// ==================================================

servidor.get('/dentistas', async (request, reply) => {
    const resultado = await sql.query(`
        SELECT * FROM dentista
        ORDER BY id
    `)

    return resultado.rows
})


// ==================================================
// DENTISTAS - BUSCAR
// ==================================================

servidor.get('/dentistas/buscar', async (request, reply) => {
    const { termo } = request.query

    if (!termo) {
        return reply.status(400).send({
            message: "termo de busca obrigatório"
        })
    }

    const resultado = await sql.query(`
        SELECT * FROM dentista
        WHERE nome ILIKE $1
           OR email ILIKE $1
        ORDER BY id
    `, [`%${termo}%`])

    return resultado.rows
})


// ==================================================
// DENTISTAS - CADASTRAR
// ==================================================

servidor.post('/dentistas', async (request, reply) => {
    const body = request.body

    if (!body || !body.nome || !body.email || !body.senha) {
        return reply.status(400).send({
            message: "nome, email e senha obrigatórios"
        })
    }

    const resultado = await sql.query(`
        INSERT INTO dentista (nome, email, senha)
        VALUES ($1, $2, $3)
        RETURNING id, nome, email
    `, [body.nome, body.email, body.senha])

    return reply.status(201).send({
        message: "DENTISTA CRIADO",
        dentista: resultado.rows[0]
    })
})


// ==================================================
// DENTISTAS - ATUALIZAR
// ==================================================

servidor.put('/dentistas/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    if (!id) {
        return reply.status(400).send({
            message: "id obrigatório"
        })
    }

    if (!body || !body.nome || !body.email || !body.senha) {
        return reply.status(400).send({
            message: "nome, email e senha obrigatórios"
        })
    }

    const dentista = await sql.query(`
        SELECT * FROM dentista
        WHERE id = $1
    `, [id])

    if (dentista.rows.length === 0) {
        return reply.status(404).send({
            message: "dentista não encontrado"
        })
    }

    await sql.query(`
        UPDATE dentista
        SET nome = $1,
            email = $2,
            senha = $3
        WHERE id = $4
    `, [body.nome, body.email, body.senha, id])

    return reply.status(200).send({
        message: "DENTISTA ATUALIZADO"
    })
})


// ==================================================
// DENTISTAS - EXCLUIR
// ==================================================

servidor.delete('/dentistas/:id', async (request, reply) => {
    const id = request.params.id

    if (!id) {
        return reply.status(400).send({
            message: "id obrigatório"
        })
    }

    const resultado = await sql.query(`
        DELETE FROM dentista
        WHERE id = $1
    `, [id])

    if (resultado.rowCount === 0) {
        return reply.status(404).send({
            message: "dentista não encontrado"
        })
    }

    return reply.status(200).send({
        message: "DENTISTA DELETADO"
    })
})


// ==================================================
// CLIENTES - LISTAR
// ==================================================

servidor.get('/clientes', async (request, reply) => {
    const resultado = await sql.query(`
        SELECT
            c.id,
            c.nome,
            c.email,
            c.cpf,
            d.id AS id_dentista,
            d.nome AS dentista
        FROM cliente c
        INNER JOIN dentista d
            ON c.id_dentista = d.id
        ORDER BY c.id
    `)

    return resultado.rows
})


// ==================================================
// CLIENTES - CADASTRAR
// ==================================================

servidor.post('/clientes', async (request, reply) => {
    const body = request.body

    if (!body || !body.nome || !body.email ||
        !body.senha || !body.cpf || !body.id_dentista) {
        return reply.status(400).send({
            message: "nome, email, senha, cpf e id_dentista obrigatórios"
        })
    }

    const resultado = await sql.query(`
        INSERT INTO cliente
        (nome, email, senha, cpf, id_dentista)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nome, email, cpf, id_dentista
    `, [
        body.nome,
        body.email,
        body.senha,
        body.cpf,
        body.id_dentista
    ])

    return reply.status(201).send({
        message: "CLIENTE CRIADO",
        cliente: resultado.rows[0]
    })
})


// ==================================================
// CLIENTES - ATUALIZAR
// ==================================================

servidor.put('/clientes/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    if (!id) {
        return reply.status(400).send({
            message: "id obrigatório"
        })
    }

    if (!body || !body.nome || !body.email ||
        !body.senha || !body.cpf || !body.id_dentista) {
        return reply.status(400).send({
            message: "nome, email, senha, cpf e id_dentista obrigatórios"
        })
    }

    const cliente = await sql.query(`
        SELECT * FROM cliente
        WHERE id = $1
    `, [id])

    if (cliente.rows.length === 0) {
        return reply.status(404).send({
            message: "cliente não encontrado"
        })
    }

    await sql.query(`
        UPDATE cliente
        SET nome = $1,
            email = $2,
            senha = $3,
            cpf = $4,
            id_dentista = $5
        WHERE id = $6
    `, [
        body.nome,
        body.email,
        body.senha,
        body.cpf,
        body.id_dentista,
        id
    ])

    return reply.status(200).send({
        message: "CLIENTE ATUALIZADO"
    })
})


// ==================================================
// CLIENTES - EXCLUIR
// ==================================================

servidor.delete('/clientes/:id', async (request, reply) => {
    const id = request.params.id

    if (!id) {
        return reply.status(400).send({
            message: "id obrigatório"
        })
    }

    const resultado = await sql.query(`
        DELETE FROM cliente
        WHERE id = $1
    `, [id])

    if (resultado.rowCount === 0) {
        return reply.status(404).send({
            message: "cliente não encontrado"
        })
    }

    return reply.status(200).send({
        message: "CLIENTE DELETADO"
    })
})


// ==================================================
// CONSULTAS - LISTAR
// ==================================================

servidor.get('/consultas', async (request, reply) => {
    const resultado = await sql.query(`
        SELECT
            c.id,
            c.tipo,
            c.descricao,
            c.data_consulta,

            d.id AS id_dentista,
            d.nome AS dentista,
            d.email AS email_dentista,

            cl.id AS id_cliente,
            cl.nome AS cliente,
            cl.email AS email_cliente,
            cl.cpf

        FROM consulta c

        INNER JOIN dentista d
            ON c.id_dentista = d.id

        INNER JOIN cliente cl
            ON c.id_cliente = cl.id

        ORDER BY c.data_consulta ASC
    `)

    return resultado.rows
})


// ==================================================
// CONSULTAS - CADASTRAR
// ==================================================

servidor.post('/consultas', async (request, reply) => {
    const body = request.body

    if (!body || !body.tipo || !body.descricao ||
        !body.data_consulta || !body.id_dentista ||
        !body.id_cliente) {
        return reply.status(400).send({
            message: "tipo, descricao, data_consulta, id_dentista e id_cliente obrigatórios"
        })
    }

    const resultado = await sql.query(`
        INSERT INTO consulta
        (tipo, descricao, data_consulta, id_dentista, id_cliente)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `, [
        body.tipo,
        body.descricao,
        body.data_consulta,
        body.id_dentista,
        body.id_cliente
    ])

    return reply.status(201).send({
        message: "CONSULTA CRIADA",
        consulta: resultado.rows[0]
    })
})


// ==================================================
// CONSULTAS - ATUALIZAR
// ==================================================

servidor.put('/consultas/:id', async (request, reply) => {
    const body = request.body
    const id = request.params.id

    if (!id) {
        return reply.status(400).send({
            message: "id obrigatório"
        })
    }

    if (!body || !body.tipo || !body.descricao ||
        !body.data_consulta || !body.id_dentista ||
        !body.id_cliente) {
        return reply.status(400).send({
            message: "tipo, descricao, data_consulta, id_dentista e id_cliente obrigatórios"
        })
    }

    const consulta = await sql.query(`
        SELECT * FROM consulta
        WHERE id = $1
    `, [id])

    if (consulta.rows.length === 0) {
        return reply.status(404).send({
            message: "consulta não encontrada"
        })
    }

    await sql.query(`
        UPDATE consulta
        SET tipo = $1,
            descricao = $2,
            data_consulta = $3,
            id_dentista = $4,
            id_cliente = $5
        WHERE id = $6
    `, [
        body.tipo,
        body.descricao,
        body.data_consulta,
        body.id_dentista,
        body.id_cliente,
        id
    ])

    return reply.status(200).send({
        message: "CONSULTA ATUALIZADA"
    })
})


// ==================================================
// CONSULTAS - EXCLUIR
// ==================================================

servidor.delete('/consultas/:id', async (request, reply) => {
    const id = request.params.id

    if (!id) {
        return reply.status(400).send({
            message: "id obrigatório"
        })
    }

    const resultado = await sql.query(`
        DELETE FROM consulta
        WHERE id = $1
    `, [id])

    if (resultado.rowCount === 0) {
        return reply.status(404).send({
            message: "consulta não encontrada"
        })
    }

    return reply.status(200).send({
        message: "CONSULTA DELETADA"
    })
})


// ==================================================
// INICIAR SERVIDOR
// ==================================================

try {
    await servidor.listen({
        port: 3000,
        host: '0.0.0.0'
    })

    console.log('Servidor rodando na porta 3000')
} catch (erro) {
    console.error(erro)
    process.exit(1)
}