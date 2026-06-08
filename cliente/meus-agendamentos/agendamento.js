// ===== CATÁLOGO DE SERVIÇOS =====
const SERVICOS_PADRAO = {
    'cabelos-curtos': {
        titulo: 'Cabelos Curtos',
        itens: [
            { nome: 'Corte curto simples (máquina, raspado, disfarçado)', preco: 45, apartirde: true },
            { nome: 'Sidecut / Undercut', preco: 25 },
            { nome: 'Corte curto + desenho simples', preco: 50 },
            { nome: 'Corte curto + desenho grande', preco: 55 },
            { nome: 'Corte curto com acabamento fixo', preco: 55 },
            { nome: 'Pézinho', preco: 20 },
            { nome: 'Realinhamento de cachos curtos', preco: 20, apartirde: true },
            { nome: 'Hidratação simples (cabelo curto)', preco: 50, apartirde: true },
            { nome: 'Cronograma Capilar (cabelo curto)', preco: 150, apartirde: true },
        ]
    },
    'combos-curtos': {
        titulo: 'Combos — Cabelos Curtos',
        itens: [
            { nome: 'Corte simples + Barba', preco: 60 },
            { nome: 'Corte simples + Design', preco: 60 },
            { nome: 'Corte simples + Hidratação + Finalização', preco: 75 },
            { nome: 'Corte simples + Limpeza Facial Zona T', preco: 65 },
            { nome: 'Corte simples + Barba + Design de sobrancelhas', preco: 75 },
            { nome: 'Corte simples + sobrancelhas + Hidratação + Finalização', preco: 95 },
            { nome: 'Corte simples + Barba + sobrancelhas + Hidratação + Finalização', preco: 125 },
            { nome: 'Corte + Barba + Design + Hidratação + Limpeza Facial', preco: 155 },
        ]
    },
    'cabelos-longos': {
        titulo: 'Cabelos Longos',
        itens: [
            { nome: 'Corte longo', preco: 70, apartirde: true },
            { nome: 'Hidratação simples', preco: 85, apartirde: true },
            { nome: 'Cronograma Capilar (12 hidratações)', preco: 350, apartirde: true },
        ]
    },
    'combos-longos': {
        titulo: 'Combos — Cabelos Longos',
        itens: [
            { nome: 'Corte longo + Hidratação + Finalização', preco: 165 },
            { nome: 'Corte longo + Hidratação + Finalização + Limpeza Facial', preco: 180 },
        ]
    },
    'rosto': {
        titulo: 'Rosto',
        itens: [
            { nome: 'Design de Sobrancelha', preco: 35 },
            { nome: 'Design com Henna', preco: 50 },
            { nome: 'Epilação Rosto', preco: 45 },
            { nome: 'Epilação Buço', preco: 20 },
            { nome: 'Barba', preco: 30 },
            { nome: 'Limpeza Facial Zona T', preco: 25 },
        ]
    }
};

const SERVICOS = (() => {
    const salvo = localStorage.getItem('blackbil_servicos');
    const data  = salvo ? JSON.parse(salvo) : SERVICOS_PADRAO;
    Object.values(data).forEach(cat => { if (!cat.fotos) cat.fotos = []; });
    return data;
})();

const HORARIOS_MANHA = ['09:00', '09:30', '10:00', '10:30', '11:00'];
const HORARIOS_TARDE = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
const HORARIOS_NOITE = ['18:00', '18:30', '19:00'];
const TODOS_HORARIOS = [...HORARIOS_MANHA, ...HORARIOS_TARDE, ...HORARIOS_NOITE];

// Retorna todos os slots ocupados por um agendamento com base na duração
function slotsCobertos(horarioInicio, duracao) {
    const inicio = TODOS_HORARIOS.indexOf(horarioInicio);
    if (inicio === -1) return [];
    const numSlots = Math.ceil((duracao || 30) / 30);
    return TODOS_HORARIOS.slice(inicio, inicio + numSlots);
}

// Retorna Set de slots em que NÃO é possível iniciar um serviço de 'duracao' minutos
function slotsIndisponiveis(dataISO, duracao) {
    const agendamentos = JSON.parse(localStorage.getItem('blackbil_agendamentos') || '[]')
        .filter(a => a.data === dataISO && a.status === 'confirmado');
    const bloqueios = JSON.parse(localStorage.getItem('blackbil_bloqueios') || '[]')
        .filter(b => b.data === dataISO);

    const ocupados = new Set();
    agendamentos.forEach(ag => slotsCobertos(ag.horario, ag.duracao || 30).forEach(h => ocupados.add(h)));
    bloqueios.forEach(b => ocupados.add(b.horario));

    const indisponiveis = new Set();
    TODOS_HORARIOS.forEach(h => {
        const precisaria = slotsCobertos(h, duracao);
        if (precisaria.length === 0 || precisaria.some(s => ocupados.has(s))) {
            indisponiveis.add(h);
        }
    });
    return indisponiveis;
}

const MESES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const DIAS_EXTENSO = [
    'Domingo','Segunda-feira','Terça-feira','Quarta-feira',
    'Quinta-feira','Sexta-feira','Sábado'
];

// ===== ESTADO =====
const estado = {
    passoAtual: 1,
    categoriaAtual: 'cabelos-curtos',
    servicoSelecionado: null,
    dataSelecionada: null,
    horarioSelecionado: null,
    calMes: new Date().getMonth(),
    calAno: new Date().getFullYear()
};

// ===== REFERÊNCIAS DOM =====
const passos   = [1,2,3,4,5].map(n => document.getElementById(`passo-${n}`));
const etapas   = [1,2,3,4].map(n => document.getElementById(`etapa-${n}`));
const linhas   = [1,2,3].map(n => document.getElementById(`linha-${n}`));

// ===== NAVEGAÇÃO ENTRE PASSOS =====
function irParaPasso(n) {
    passos.forEach((p, i) => p.classList.toggle('escondido', i !== n - 1));

    etapas.forEach((e, i) => {
        e.classList.toggle('ativa',    i === n - 1);
        e.classList.toggle('concluida', i < n - 1);
    });
    linhas.forEach((l, i) => {
        l.classList.toggle('concluida', i < n - 1);
    });

    estado.passoAtual = n;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== ACCORDION DE FOTOS =====
function renderAcordeon(cat) {
    const fotos  = SERVICOS[cat].fotos || [];
    const label  = document.getElementById('accordion-label-text');
    const grid   = document.getElementById('fotos-grid');
    const toggle = document.getElementById('accordion-toggle');
    const body   = document.getElementById('accordion-body');

    label.textContent = fotos.length > 0
        ? `Ver exemplos (${fotos.length})`
        : 'Ver exemplos';

    grid.innerHTML = fotos.length > 0
        ? fotos.map(f => `<img class="foto-thumb" src="${f.url}" alt="Exemplo de serviço">`).join('')
        : '<p class="fotos-vazia">Nenhuma foto disponível para esta categoria.</p>';

    toggle.classList.remove('aberto');
    body.classList.add('escondido');
}

document.getElementById('accordion-toggle').addEventListener('click', () => {
    document.getElementById('accordion-toggle').classList.toggle('aberto');
    document.getElementById('accordion-body').classList.toggle('escondido');
});

// ===== PASSO 1: SERVIÇOS =====
function renderServicos(cat) {
    const lista = document.getElementById('servicos-lista');
    const { itens } = SERVICOS[cat];

    lista.innerHTML = itens.map((s, i) => `
        <div class="servico-item" data-cat="${cat}" data-index="${i}">
            <input type="radio" name="servico" id="srv-${i}">
            <div class="servico-info">
                <label class="servico-nome" for="srv-${i}">${s.nome}</label>
            </div>
            <div class="servico-preco">
                ${s.apartirde ? '<span class="apartirde">a partir de</span>' : ''}
                R$ ${s.preco.toFixed(2).replace('.', ',')}
            </div>
        </div>
    `).join('');

    lista.querySelectorAll('.servico-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.servico-item').forEach(i => i.classList.remove('selecionado'));
            item.classList.add('selecionado');
            item.querySelector('input[type="radio"]').checked = true;

            const idx = parseInt(item.dataset.index);
            const categoria = item.dataset.cat;
            estado.servicoSelecionado = {
                ...SERVICOS[categoria].itens[idx],
                categoria: SERVICOS[categoria].titulo
            };
            document.getElementById('btn-proximo-1').disabled = false;
        });
    });
}

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('ativo'));
        tab.classList.add('ativo');
        estado.categoriaAtual = tab.dataset.cat;
        estado.servicoSelecionado = null;
        document.getElementById('btn-proximo-1').disabled = true;
        renderServicos(tab.dataset.cat);
        renderAcordeon(tab.dataset.cat);
    });
});

document.getElementById('btn-proximo-1').addEventListener('click', () => irParaPasso(2));

// ===== PASSO 2: CALENDÁRIO =====
function renderCalendario() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const limiteMax = new Date(hoje);
    limiteMax.setDate(limiteMax.getDate() + 30);

    const { calMes: mes, calAno: ano } = estado;
    document.getElementById('cal-titulo').textContent = `${MESES[mes]} de ${ano}`;

    const mesAtualNum  = hoje.getMonth();
    const anoAtualNum  = hoje.getFullYear();
    const mesLimite    = limiteMax.getMonth();
    const anoLimite    = limiteMax.getFullYear();

    const btnAnt = document.getElementById('btn-mes-ant');
    const btnPro = document.getElementById('btn-mes-pro');

    const eAnteriorAoAtual = ano < anoAtualNum || (ano === anoAtualNum && mes < mesAtualNum);
    const eAposLimite      = ano > anoLimite   || (ano === anoLimite   && mes > mesLimite);

    btnAnt.disabled = eAnteriorAoAtual || (ano === anoAtualNum && mes === mesAtualNum);
    btnPro.disabled = eAposLimite      || (ano === anoLimite   && mes === mesLimite);

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const diasNoMes  = new Date(ano, mes + 1, 0).getDate();

    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    for (let i = 0; i < primeiroDia; i++) {
        const vazio = document.createElement('div');
        vazio.className = 'cal-dia vazio';
        grid.appendChild(vazio);
    }

    for (let d = 1; d <= diasNoMes; d++) {
        const data = new Date(ano, mes, d);
        const passado    = data < hoje;
        const alem30     = data > limiteMax;
        const diaSemana  = data.getDay();
        const fechado    = diaSemana === 0 || diaSemana === 1;
        const isHoje     = data.getTime() === hoje.getTime();

        const btn = document.createElement('div');
        btn.textContent = d;
        btn.className = 'cal-dia';
        if (isHoje)                         btn.classList.add('hoje');
        if (fechado)                        btn.classList.add('domingo');
        if (passado || fechado || alem30)   btn.classList.add('desabilitado');

        if (estado.dataSelecionada) {
            const sel = estado.dataSelecionada;
            if (sel.getFullYear() === ano && sel.getMonth() === mes && sel.getDate() === d) {
                btn.classList.add('selecionado');
            }
        }

        if (!passado && !fechado && !alem30) {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cal-dia').forEach(c => c.classList.remove('selecionado'));
                btn.classList.add('selecionado');
                estado.dataSelecionada = new Date(ano, mes, d);
                document.getElementById('btn-proximo-2').disabled = false;
            });
        }

        grid.appendChild(btn);
    }
}

document.getElementById('btn-mes-ant').addEventListener('click', () => {
    if (estado.calMes === 0) { estado.calMes = 11; estado.calAno--; }
    else estado.calMes--;
    renderCalendario();
});

document.getElementById('btn-mes-pro').addEventListener('click', () => {
    if (estado.calMes === 11) { estado.calMes = 0; estado.calAno++; }
    else estado.calMes++;
    renderCalendario();
});

document.getElementById('btn-voltar-2').addEventListener('click', () => irParaPasso(1));
document.getElementById('btn-proximo-2').addEventListener('click', () => {
    renderHorarios();
    irParaPasso(3);
});

// ===== PASSO 3: HORÁRIOS =====
function renderHorarios() {
    const dataISO = (() => {
        const d = estado.dataSelecionada;
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();
    const duracao = estado.servicoSelecionado?.duracao || 30;
    const indisponiveis = slotsIndisponiveis(dataISO, duracao);

    function criarBotoes(containerId, horarios) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const disponiveis = horarios.filter(h => !indisponiveis.has(h));

        if (disponiveis.length === 0) {
            container.innerHTML = '<p class="horarios-vazio">Sem horários disponíveis</p>';
            return;
        }

        disponiveis.forEach(h => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-horario';
            btn.textContent = h;
            if (estado.horarioSelecionado === h) btn.classList.add('selecionado');
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-horario').forEach(b => b.classList.remove('selecionado'));
                btn.classList.add('selecionado');
                estado.horarioSelecionado = h;
                document.getElementById('btn-proximo-3').disabled = false;
            });
            container.appendChild(btn);
        });
    }
    criarBotoes('grade-manha', HORARIOS_MANHA);
    criarBotoes('grade-tarde', HORARIOS_TARDE);
    criarBotoes('grade-noite', HORARIOS_NOITE);
}

document.getElementById('btn-voltar-3').addEventListener('click', () => irParaPasso(2));
document.getElementById('btn-proximo-3').addEventListener('click', () => {
    const sessao = JSON.parse(localStorage.getItem('blackbil_sessao') || 'null');

    if (!sessao || sessao.tipo !== 'cliente') {
        localStorage.setItem('blackbil_agendamento_pendente', JSON.stringify({
            servico:  estado.servicoSelecionado,
            data:     estado.dataSelecionada.toISOString(),
            horario:  estado.horarioSelecionado
        }));
        window.location.href = '../login/login.html';
        return;
    }

    preencherResumo();
    irParaPasso(4);
});

// ===== PASSO 4: RESUMO =====
function preencherResumo() {
    const s = estado.servicoSelecionado;
    const d = estado.dataSelecionada;

    document.getElementById('res-servico').textContent  = s.nome;
    document.getElementById('res-categoria').textContent = s.categoria;
    document.getElementById('res-preco').textContent    =
        `${s.apartirde ? 'A partir de ' : ''}R$ ${s.preco.toFixed(2).replace('.', ',')}`;
    document.getElementById('res-data').textContent     =
        `${DIAS_EXTENSO[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
    document.getElementById('res-horario').textContent  = estado.horarioSelecionado;
}

document.getElementById('btn-voltar-4').addEventListener('click', () => irParaPasso(3));
document.getElementById('btn-confirmar').addEventListener('click', () => {
    const s = estado.servicoSelecionado;
    const d = estado.dataSelecionada;
    const isoData = d =>
        `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    const sessao = JSON.parse(localStorage.getItem('blackbil_sessao') || 'null');
    const lista  = JSON.parse(localStorage.getItem('blackbil_agendamentos') || '[]');
    lista.push({
        id:         Date.now().toString(),
        clienteId:  sessao?.id || null,
        clienteNome: sessao?.nome || null,
        servico:    s.nome,
        categoria:  s.categoria,
        preco:      s.preco,
        duracao:    s.duracao || 30,
        apartirde:  !!s.apartirde,
        data:       isoData(d),
        horario:    estado.horarioSelecionado,
        status:     'confirmado'
    });
    localStorage.setItem('blackbil_agendamentos', JSON.stringify(lista));

    irParaPasso(5);
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('ativo');
    navMenu.classList.toggle('aberto');
});

navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('ativo');
        navMenu.classList.remove('aberto');
    });
});

// ===== ÍCONE DE USUÁRIO =====
(function iniciarUsuario() {
    const sessao   = JSON.parse(localStorage.getItem('blackbil_sessao') || 'null');
    const btn      = document.getElementById('btn-usuario');
    const dropdown = document.getElementById('usuario-dropdown');
    const inicial  = document.getElementById('usuario-inicial');

    if (sessao && sessao.tipo === 'cliente') {
        // Logado: mostra inicial do nome
        const letra = sessao.nome.charAt(0).toUpperCase();
        inicial.textContent = letra;
        inicial.classList.add('tem-inicial');
        document.getElementById('dropdown-deslogado').classList.add('escondido');
        document.getElementById('dropdown-logado').classList.remove('escondido');
        document.getElementById('dropdown-nome').textContent = sessao.nome;
    }

    // Abre/fecha dropdown
    btn.addEventListener('click', e => {
        e.stopPropagation();
        const aberto = !dropdown.classList.contains('escondido');
        dropdown.classList.toggle('escondido', aberto);
        btn.setAttribute('aria-expanded', String(!aberto));
    });

    // Fecha ao clicar fora
    document.addEventListener('click', () => dropdown.classList.add('escondido'));
    dropdown.addEventListener('click', e => e.stopPropagation());

    // Logout
    const btnSair = document.getElementById('btn-sair-cliente');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            localStorage.removeItem('blackbil_sessao');
            location.reload();
        });
    }
})();

// ===== INIT =====
(function init() {
    const pendente = JSON.parse(localStorage.getItem('blackbil_agendamento_pendente') || 'null');
    const sessao   = JSON.parse(localStorage.getItem('blackbil_sessao') || 'null');

    if (pendente && sessao && sessao.tipo === 'cliente') {
        localStorage.removeItem('blackbil_agendamento_pendente');

        estado.servicoSelecionado = pendente.servico;
        estado.dataSelecionada    = new Date(pendente.data);
        estado.horarioSelecionado = pendente.horario;
        estado.calMes = estado.dataSelecionada.getMonth();
        estado.calAno = estado.dataSelecionada.getFullYear();

        renderServicos(estado.categoriaAtual);
        renderAcordeon(estado.categoriaAtual);
        renderCalendario();
        preencherResumo();
        irParaPasso(4);
        return;
    }

    renderServicos(estado.categoriaAtual);
    renderAcordeon(estado.categoriaAtual);
    renderCalendario();
    irParaPasso(1);
})();
