import express from "express";
import cors from "cors";
import { Expo } from "expo-server-sdk";
import { PrismaClient } from '@prisma/client';

import chamandoCron from "./service/Cron.js";
import ServerEsp from "./routes/ServerEsp.js";

const prisma = new PrismaClient();
process.env.TZ = 'America/Sao_Paulo';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/comand', ServerEsp);

const expo = new Expo();

app.get('/registros', async (req, res) => { // Esse get pode usado tanto pra pegar um registro em especifico quanto pra pegar todos os resultados caso n venha nada no "query"

  let prod = [];
  
  if(req.query) {
    const { name } = req.query;
    const { scheduled_at } = req.query;

    if(scheduled_at) {
      if(scheduled_at == 'null') {
        var nulo = {
          not: null
        };
      } else {
        var nulo = {
          equals: null
        };
      }

      var order = {scheduled_at: 'asc'};
    } else {
      var nulo = {};
      var order = {id: 'asc'};
    }

    prod = await prisma.registros.findMany({
      where: {
        name: name,
        scheduled_at: nulo
      },
      orderBy: order
    })
  } else {
    prod = await prisma.registros.findMany()
  }

  res.status(200).json(prod)
})

app.get('/todasLinhas', async (req, res) => {
  const linhas = await prisma.registros.count();
  return res.status(200).json(linhas);
})

app.put('/registros/:id', async (req, res) => {
  const { id } = req.params;
  const { is_open, scheduled_at } = req.body;

  
  const Data = {};  // Validação básica
  if (is_open !== undefined) Data.is_open = is_open;
  if (scheduled_at !== undefined) Data.scheduled_at = scheduled_at;

  try {
      const registroExistente = await prisma.registros.findUnique({
          where: { id }, // Verifica se existe realmente uma linha no db com esse id, caso não houver, retorna o erro abaixo
      });

      if (!registroExistente) {
          return res.status(404).json({ error: 'Registro não encontrado' });
      }

      const registroAtualizado = await prisma.registros.update({
          where: { id },
          data: Data,
      });

      res.status(200).json(registroAtualizado);
  } catch (error) {
      console.error('Erro ao atualizar registro:', error);

      if (error.code === 'P2025') {
      // Erro de registro não encontrado
      res.status(404).json({ error: 'Registro não encontrado' });
      } else {
      // Outros erros
      res.status(500).json({ error: 'Erro interno do servidor' });
      }
  }
});

app.post('/tokens',  async (req, res) => {
  const { token } = req.body;

    const prod = await prisma.tokens.findMany({
      where: {
        token
      }
    })
    
    if(prod.length > 0) {
      return false;
    }

    await prisma.tokens.create({
      data: {
        token: req.body.token,
      }
    })
    
    res.status(201).json({msg: 'Token cadastrado com sucesso!'});
})

app.post('/send-notification', async (req, res) => {
  const { token, title, body } = req.body;

  if (!Expo.isExpoPushToken(token)) {
      return res.status(400).send('Token inválido');
  }

  const message = {
      to: token,
      sound: 'sound.mp3',
      title: title,
      body: body,
      data: { someData: 'goes here' },
  };

  try {
      const ticket = await expo.sendPushNotificationsAsync([message]);
      console.log('Notificação enviada com sucesso:', ticket);
      res.status(200).send('Notificação enviada');
  } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      res.status(500).send('Erro ao enviar notificação');
  }
});

chamandoCron(prisma); // Inicia a Cron que verifica se tem algum agendamento

app.listen(3000, '0.0.0.0', () => {console.log('Entrou na api')});



// app.delete('/registros/:id',  async (req, res) => {

//     await prisma.registros.delete({
//       where: {
//         id: req.params.id
//       }
//     })

//     res.status(200).json({ msg: 'registros deletado com sucesso' });
// })



// user: ruanhoinaski
// senha: LbnJuiSMNRqvvWJK

// Comandos uteis para o node:

// node --watch index.js   -- Starta a api e atualiza ela sempre que salvar o arquivo
// npx prisma studio -- Abre o gerenciador de banco de dados do Prisma