//CONFIGURAÇÕES BÁSICAS
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');

const pool = require('./database'); // conexão local com o banco

const PORT =process.env.PORT || 3000;

//  MIDDLEWARES
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

//VIEW ENGINE
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//SESSÃO
app.use(session({
  secret: 'chave_super_segura_local',
  resave: false,
  saveUninitialized: false
}));

// TESTE DE CONEXÃO COM O BANCO
pool.query('SELECT NOW()')
  .then(result => {
    console.log('✅ Conectado ao PostgreSQL');
    console.log('🕒 Hora do banco:', result.rows[0].now);
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco:', err.message);
  });

// PROTEÇÃO DE ROTAS
function protegerRota(req, res, next) {
  if (req.session.logado) {
    return next();
  }
  res.redirect('/');
}

//ROTAS

// LOGIN (tela)
app.get('/', (req, res) => {
  res.render('pages/form');
  console.log('Acessou a página de login');
});

// LOGIN (verificação)
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM login WHERE email = $1 AND senha = $2',
      [email, senha]
    );

    if (result.rows.length > 0) {
      req.session.logado = true;
      return res.redirect('/home');
    }

    return res.render('pages/form', {
      erro: 'Usuário ou senha inválidos'
    });

  } catch (err) {
    console.error('❌ Erro no login:', err.message);
    res.status(500).send('Erro ao fazer login');
  }
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// HOME
app.get('/home', protegerRota, (req, res) => {
  res.render('pages/home');
});

// CADASTRO
app.get('/cadastro', protegerRota, (req, res) => {
  res.render('pages/cadastro');
});

// SALVAR
app.post('/salvar', protegerRota, async (req, res) => {
  const { nome, numero, data_emissao } = req.body;

  try {
    await pool.query(
      'INSERT INTO oficio (nome, numero, data_emissao) VALUES ($1, $2, $3)',
      [nome, numero, data_emissao]
    );

    res.redirect('/lister');
  } catch (err) {
    console.error('Erro ao salvar ofício:', err.message);
    res.status(500).send('Erro ao salvar ofício');
  }
});

// LISTAR
app.get('/lister', protegerRota, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM oficio ORDER BY CAST(numero AS INTEGER) DESC'
    );

    res.render('pages/lister', { oficios: result.rows });
  } catch (err) {
    console.error('Erro ao listar ofícios:', err.message);
    res.status(500).send('Erro ao listar ofícios');
  }
});

// DELETAR
app.get('/oficio/:id', protegerRota, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM oficio WHERE id = $1', [id]);
    res.redirect('/lister');
  } catch (err) {
    console.error('Erro ao deletar ofício:', err.message);
    res.status(500).send('Erro ao deletar ofício');
  }
});

//CARREGAR DADOS
app.get('/oficio/editar/:id', protegerRota, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM oficio WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Ofício não encontrado');
    }

    res.render('editar', { oficio: result.rows[0] });

  } catch (err) {
    console.error('Erro ao carregar edição:', err.message);
    res.status(500).send('Erro ao carregar edição');
  }
});

// ===== EDITAR (ATUALIZAR) =====
app.post('/oficio/editar/:id', protegerRota, async (req, res) => {
  const { id } = req.params;
  const { nome, numero, data_emissao } = req.body;

  try {
    // buscar dados atuais
    const atual = await pool.query(
      'SELECT * FROM oficio WHERE id = $1',
      [id]
    );

    if (atual.rowCount === 0) {
      return res.status(404).send('Ofício não encontrado');
    }

    const oficioAtual = atual.rows[0];

    const novoNome   = nome && nome.trim() !== '' ? nome : oficioAtual.nome;
    const novoNumero = numero && numero.trim() !== '' ? numero : oficioAtual.numero;
    const novaData   = data_emissao && data_emissao !== '' ? data_emissao : oficioAtual.data_emissao;

    await pool.query(
      'UPDATE oficio SET nome = $1, numero = $2, data_emissao = $3 WHERE id = $4',
      [novoNome, novoNumero, novaData, id]
    );

    res.redirect('/lister');

  } catch (err) {
    console.error('Erro ao atualizar ofício:', err.message);
    res.status(500).send('Erro ao atualizar ofício');
  }
});

// SERVIDOR
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
