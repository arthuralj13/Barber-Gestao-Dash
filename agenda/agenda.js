// ===== PROTEÇÃO DE PÁGINA =====
(function() {
    const sessao = JSON.parse(localStorage.getItem('blackbil_sessao') || 'null');
    if (!sessao || sessao.tipo !== 'funcionario') {
        window.location.href = '../login/login.html';
    }
})();

const HORARIOS_MANHA = ['09:00','09:30','10:00','10:30','11:00'];
const HORARIOS_TARDE = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
const HORARIOS_NOITE = ['18:00', '18:30', '19:00'];
const TODOS_HORARIOS = [...HORARIOS_MANHA, ...HORARIOS_TARDE, ...HORARIOS_NOITE];

function slotsCobertos(horarioInicio, duracao) {
    const inicio = TODOS_HORARIOS.indexOf(horarioInicio);
    if (inicio === -1) return [];
    const numSlots = Math.ceil((duracao || 30) / 30);
    return TODOS_HORARIOS.slice(inicio, inicio + numSlots);
}

function formatarDuracao(min) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

// Retorna Set de slots que são extensão de um agendamento (não o slot inicial)
function slotsExtensao(dataISO) {
    const extensoes = new Set();
    carregarAgendamentos()
        .filter(a => a.data === dataISO && a.status === 'confirmado')
        .forEach(ag => slotsCobertos(ag.horario, ag.duracao || 30).slice(1).forEach(h => extensoes.add(h)));
    return extensoes;
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
    dataAtual: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })()
};

// ===== HELPERS =====
function isoData(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function formatPreco(ag) {
    return `${ag.apartirde ? 'A partir de ' : ''}R$ ${ag.preco.toFixed(2).replace('.', ',')}`;
}

// ===== PERSISTÊNCIA =====
function carregarAgendamentos() {
    return JSON.parse(localStorage.getItem('blackbil_agendamentos') || '[]');
}
function salvarAgendamentos(lista) {
    localStorage.setItem('blackbil_agendamentos', JSON.stringify(lista));
}
function carregarBloqueios() {
    return JSON.parse(localStorage.getItem('blackbil_bloqueios') || '[]');
}
function salvarBloqueios(lista) {
    localStorage.setItem('blackbil_bloqueios', JSON.stringify(lista));
}

// ===== ESTADO DO SLOT =====
function estadoSlot(dataISO, horario) {
    const ag = carregarAgendamentos().find(
        a => a.data === dataISO && a.horario === horario && a.status === 'confirmado'
    );
    if (ag) return { tipo: 'ocupado', agendamento: ag };

    const bl = carregarBloqueios().find(b => b.data === dataISO && b.horario === horario);
    if (bl) return { tipo: 'bloqueado' };

    return { tipo: 'livre' };
}

// ===== RENDER NAV DATA =====
function renderNavData() {
    const d = estado.dataAtual;
    document.getElementById('dia-semana').textContent   = DIAS_EXTENSO[d.getDay()];
    document.getElementById('data-completa').textContent = `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;

    const hoje = new Date(); hoje.setHours(0,0,0,0);
    document.getElementById('btn-hoje').classList.toggle('ativo', d.getTime() === hoje.getTime());
}

// ===== RENDER RESUMO =====
function renderResumo() {
    const dataISO      = isoData(estado.dataAtual);
    const agendamentos = carregarAgendamentos().filter(a => a.data === dataISO && a.status === 'confirmado');
    const bloqueios    = carregarBloqueios().filter(b => b.data === dataISO);
    const div          = document.getElementById('resumo-dia');

    if (agendamentos.length === 0 && bloqueios.length === 0) {
        div.innerHTML = '<span class="badge badge-livre">Dia livre</span>';
        return;
    }

    let html = '';
    if (agendamentos.length > 0)
        html += `<span class="badge badge-ocupado">${agendamentos.length} agendamento${agendamentos.length > 1 ? 's' : ''}</span>`;
    if (bloqueios.length > 0)
        html += `<span class="badge badge-bloqueado">${bloqueios.length} bloqueio${bloqueios.length > 1 ? 's' : ''}</span>`;

    div.innerHTML = html;
}

// ===== RENDER SLOTS =====
function renderSlots() {
    const dataISO  = isoData(estado.dataAtual);
    const extensao = slotsExtensao(dataISO);
    renderPeriodo('slots-manha', HORARIOS_MANHA, extensao);
    renderPeriodo('slots-tarde', HORARIOS_TARDE, extensao);
    renderPeriodo('slots-noite', HORARIOS_NOITE, extensao);
}

function renderPeriodo(containerId, horarios, extensao) {
    const dataISO   = isoData(estado.dataAtual);
    const container = document.getElementById(containerId);

    const html = horarios
        .filter(h => !extensao.has(h))
        .map(h => {
            const { tipo, agendamento } = estadoSlot(dataISO, h);
            let conteudo = '';

            if (tipo === 'ocupado') {
                conteudo = `
                    <div class="slot-info">
                        <span class="slot-servico">${agendamento.servico}</span>
                        <span class="slot-cat">${agendamento.categoria} · ${formatarDuracao(agendamento.duracao || 30)}</span>
                    </div>
                    <span class="slot-preco">${formatPreco(agendamento)}</span>
                `;
            } else if (tipo === 'bloqueado') {
                conteudo = `<span class="slot-label">Bloqueado</span>`;
            } else {
                conteudo = `<span class="slot-label">Livre</span>`;
            }

            return `
                <div class="slot slot-${tipo}" data-horario="${h}" data-data="${dataISO}" data-tipo="${tipo}">
                    <span class="slot-hora">${h}</span>
                    <div class="slot-conteudo">${conteudo}</div>
                    <span class="slot-chevron">›</span>
                </div>
            `;
        }).join('');

    container.innerHTML = html || '<p class="horarios-vazio">Sem slots neste período</p>';

    container.querySelectorAll('.slot').forEach(slot => {
        slot.addEventListener('click', () =>
            abrirModal(slot.dataset.data, slot.dataset.horario, slot.dataset.tipo)
        );
    });
}

// ===== MODAL =====
function abrirModal(dataISO, horario, tipo) {
    const titulo = document.getElementById('modal-titulo');
    const body   = document.getElementById('modal-body');
    const acoes  = document.getElementById('modal-acoes');

    titulo.textContent = horario;
    body.innerHTML = '';
    acoes.innerHTML = '';

    if (tipo === 'ocupado') {
        const ag = carregarAgendamentos().find(
            a => a.data === dataISO && a.horario === horario && a.status === 'confirmado'
        );

        body.innerHTML = `
            <div class="detalhe-item">
                <span class="detalhe-rotulo">Serviço</span>
                <span class="detalhe-valor">${ag.servico}</span>
            </div>
            <div class="detalhe-item">
                <span class="detalhe-rotulo">Categoria</span>
                <span class="detalhe-valor">${ag.categoria}</span>
            </div>
            <div class="detalhe-item">
                <span class="detalhe-rotulo">Duração</span>
                <span class="detalhe-valor">${formatarDuracao(ag.duracao || 30)}</span>
            </div>
            <div class="detalhe-item">
                <span class="detalhe-rotulo">Valor</span>
                <span class="detalhe-valor destaque">${formatPreco(ag)}</span>
            </div>
        `;

        acoes.innerHTML = `
            <button class="btn-concluir" id="btn-concluir">✓ Concluído</button>
            <button class="btn-cancelar-ag" id="btn-cancelar-ag">✕ Cancelar</button>
        `;

        document.getElementById('btn-concluir').addEventListener('click', () => {
            atualizarStatus(dataISO, horario, 'concluido');
            fecharModal();
        });
        document.getElementById('btn-cancelar-ag').addEventListener('click', () => {
            if (confirm('Cancelar este agendamento?')) {
                atualizarStatus(dataISO, horario, 'cancelado');
                fecharModal();
            }
        });

    } else if (tipo === 'bloqueado') {
        body.innerHTML = `<p class="detalhe-info">Este horário está bloqueado e não aparece para agendamento.</p>`;
        acoes.innerHTML = `<button class="btn-desbloquear" id="btn-desbloquear">Desbloquear horário</button>`;

        document.getElementById('btn-desbloquear').addEventListener('click', () => {
            desbloquearSlot(dataISO, horario);
            fecharModal();
        });

    } else {
        body.innerHTML = `<p class="detalhe-info">Este horário está livre para agendamento pelos clientes.</p>`;
        acoes.innerHTML = `<button class="btn-bloquear" id="btn-bloquear">Bloquear horário</button>`;

        document.getElementById('btn-bloquear').addEventListener('click', () => {
            bloquearSlot(dataISO, horario);
            fecharModal();
        });
    }

    document.getElementById('modal-overlay').classList.remove('escondido');
}

function fecharModal() {
    document.getElementById('modal-overlay').classList.add('escondido');
}

// ===== AÇÕES =====
function atualizarStatus(dataISO, horario, novoStatus) {
    const lista = carregarAgendamentos();
    const ag    = lista.find(a => a.data === dataISO && a.horario === horario && a.status === 'confirmado');
    if (ag) ag.status = novoStatus;
    salvarAgendamentos(lista);
    renderResumo();
    renderSlots();
}

function bloquearSlot(dataISO, horario) {
    const lista = carregarBloqueios();
    if (!lista.find(b => b.data === dataISO && b.horario === horario))
        lista.push({ data: dataISO, horario });
    salvarBloqueios(lista);
    renderResumo();
    renderSlots();
}

function desbloquearSlot(dataISO, horario) {
    salvarBloqueios(carregarBloqueios().filter(
        b => !(b.data === dataISO && b.horario === horario)
    ));
    renderResumo();
    renderSlots();
}

// ===== NAVEGAÇÃO DE DATA =====
document.getElementById('btn-dia-ant').addEventListener('click', () => {
    estado.dataAtual.setDate(estado.dataAtual.getDate() - 1);
    renderTudo();
});
document.getElementById('btn-dia-pro').addEventListener('click', () => {
    estado.dataAtual.setDate(estado.dataAtual.getDate() + 1);
    renderTudo();
});
document.getElementById('btn-hoje').addEventListener('click', () => {
    estado.dataAtual = new Date(); estado.dataAtual.setHours(0,0,0,0);
    renderTudo();
});

// ===== MODAL EVENTOS =====
document.getElementById('modal-fechar').addEventListener('click', fecharModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') fecharModal();
});

// ===== LOGOUT =====
document.getElementById('btn-sair').addEventListener('click', () => {
    localStorage.removeItem('blackbil_sessao');
    window.location.href = '../login/login.html';
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

// ===== INIT =====
function renderTudo() {
    renderNavData();
    renderResumo();
    renderSlots();
}

renderTudo();
