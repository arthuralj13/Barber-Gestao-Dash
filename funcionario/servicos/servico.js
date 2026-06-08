// ===== PROTEÇÃO DE PÁGINA =====
(function() {
    const sessao = JSON.parse(localStorage.getItem('blackbil_sessao') || 'null');
    if (!sessao || sessao.tipo !== 'funcionario') {
        window.location.href = '../login/login.html';
    }
})();

// ===== DADOS PADRÃO =====
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
        titulo: 'Combos — Curtos',
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
        titulo: 'Combos — Longos',
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

// ===== HELPERS =====
function formatarDuracao(min) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

// ===== PERSISTÊNCIA =====
const CHAVE_LOCAL = 'blackbil_servicos';

function carregarCatalogo() {
    const salvo = localStorage.getItem(CHAVE_LOCAL);
    const data  = salvo ? JSON.parse(salvo) : JSON.parse(JSON.stringify(SERVICOS_PADRAO));
    Object.values(data).forEach(cat => { if (!cat.fotos) cat.fotos = []; });
    return data;
}

function salvarCatalogo() {
    try {
        localStorage.setItem(CHAVE_LOCAL, JSON.stringify(catalogo));
    } catch (e) {
        alert('Armazenamento local cheio. Remova algumas fotos para continuar.');
    }
}

let catalogo = carregarCatalogo();

// ===== ESTADO =====
let categoriaAtual = Object.keys(catalogo)[0];
let editandoIndex  = null;

// ===== ÍCONES =====
const ICONE_EDITAR = `
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`;

const ICONE_DELETAR = `
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>`;

// ===== RENDER TABS =====
function renderTabs() {
    const container = document.getElementById('categorias-tabs');
    container.innerHTML = Object.keys(catalogo).map(cat => `
        <button class="tab ${cat === categoriaAtual ? 'ativo' : ''}" data-cat="${cat}">
            ${catalogo[cat].titulo}
            <span class="tab-x" data-delete="${cat}" title="Excluir categoria">×</span>
        </button>
    `).join('');

    container.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            categoriaAtual = tab.dataset.cat;
            renderTabs();
            renderServicos();
            renderFotos();
        });
    });

    container.querySelectorAll('.tab-x').forEach(x => {
        x.addEventListener('click', e => {
            e.stopPropagation();
            deletarCategoria(x.dataset.delete);
        });
    });
}

// ===== RENDER SERVIÇOS =====
function renderServicos() {
    const lista  = document.getElementById('servicos-lista');
    const itens  = catalogo[categoriaAtual].itens;

    if (itens.length === 0) {
        lista.innerHTML = '<p class="lista-vazia">Nenhum serviço cadastrado nesta categoria.</p>';
        return;
    }

    lista.innerHTML = itens.map((s, i) => `
        <div class="servico-card">
            <div class="servico-info">
                <span class="servico-nome">${s.nome}</span>
                <span class="servico-meta">
                    <span class="servico-duracao">${formatarDuracao(s.duracao || 30)}</span>
                    <span class="servico-preco-wrap">
                        ${s.apartirde ? '<span class="apartirde">a partir de</span>' : ''}
                        <span class="servico-preco">R$ ${s.preco.toFixed(2).replace('.', ',')}</span>
                    </span>
                </span>
            </div>
            <div class="servico-acoes">
                <button class="btn-acao btn-editar" data-index="${i}" title="Editar">${ICONE_EDITAR}</button>
                <button class="btn-acao btn-deletar" data-index="${i}" title="Excluir">${ICONE_DELETAR}</button>
            </div>
        </div>
    `).join('');

    lista.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => abrirEdicao(parseInt(btn.dataset.index)));
    });
    lista.querySelectorAll('.btn-deletar').forEach(btn => {
        btn.addEventListener('click', () => deletarServico(parseInt(btn.dataset.index)));
    });
}

// ===== MODAL =====
function abrirModal(titulo) {
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-overlay').classList.remove('escondido');
}

function fecharModal() {
    document.getElementById('modal-overlay').classList.add('escondido');
    document.getElementById('form-servico').reset();
    editandoIndex = null;
}

function abrirAdicao() {
    editandoIndex = null;
    abrirModal('Novo Serviço — ' + catalogo[categoriaAtual].titulo);
}

function abrirEdicao(index) {
    editandoIndex = index;
    const s = catalogo[categoriaAtual].itens[index];
    document.getElementById('input-nome').value        = s.nome;
    document.getElementById('input-preco').value       = s.preco;
    document.getElementById('input-duracao').value     = s.duracao || 30;
    document.getElementById('input-apartirde').checked = !!s.apartirde;
    abrirModal('Editar Serviço');
}

function deletarServico(index) {
    const nome = catalogo[categoriaAtual].itens[index].nome;
    if (!confirm(`Excluir "${nome}"?`)) return;
    catalogo[categoriaAtual].itens.splice(index, 1);
    salvarCatalogo();
    renderServicos();
}

// ===== FORM SUBMIT =====
document.getElementById('form-servico').addEventListener('submit', e => {
    e.preventDefault();
    const nome      = document.getElementById('input-nome').value.trim();
    const preco     = parseFloat(document.getElementById('input-preco').value);
    const duracao   = parseInt(document.getElementById('input-duracao').value);
    const apartirde = document.getElementById('input-apartirde').checked;

    if (!nome || isNaN(preco) || preco < 0) return;

    const servico = { nome, preco, duracao, ...(apartirde && { apartirde: true }) };

    if (editandoIndex !== null) {
        catalogo[categoriaAtual].itens[editandoIndex] = servico;
    } else {
        catalogo[categoriaAtual].itens.push(servico);
    }

    salvarCatalogo();
    fecharModal();
    renderServicos();
});

// ===== EVENTOS DO MODAL =====
document.getElementById('btn-adicionar').addEventListener('click', abrirAdicao);
document.getElementById('modal-fechar').addEventListener('click', fecharModal);
document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') fecharModal();
});

// ===== FOTOS =====
function renderFotos() {
    const grid  = document.getElementById('fotos-gerenciar-grid');
    const fotos = catalogo[categoriaAtual]?.fotos || [];

    if (fotos.length === 0) {
        grid.innerHTML = '<p class="fotos-vazia-gerenciar">Nenhuma foto nesta categoria. Adicione fotos para exibir aos clientes no accordion de exemplos.</p>';
        return;
    }

    grid.innerHTML = fotos.map((f, i) => `
        <div class="foto-card">
            <img src="${f.url}" alt="Foto ${i + 1}">
            <button class="foto-card-deletar" data-index="${i}" title="Remover foto">✕</button>
        </div>
    `).join('');

    grid.querySelectorAll('.foto-card-deletar').forEach(btn => {
        btn.addEventListener('click', () => {
            catalogo[categoriaAtual].fotos.splice(parseInt(btn.dataset.index), 1);
            salvarCatalogo();
            renderFotos();
        });
    });
}

document.getElementById('input-foto').addEventListener('change', e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let processadas = 0;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = evt => {
            if (!catalogo[categoriaAtual].fotos) catalogo[categoriaAtual].fotos = [];
            catalogo[categoriaAtual].fotos.push({ url: evt.target.result });
            processadas++;
            if (processadas === files.length) {
                salvarCatalogo();
                renderFotos();
            }
        };
        reader.readAsDataURL(file);
    });

    e.target.value = '';
});

// ===== NOVA CATEGORIA =====
function gerarSlug(nome) {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function deletarCategoria(cat) {
    const titulo = catalogo[cat].titulo;
    const qtd    = catalogo[cat].itens.length;
    const aviso  = qtd > 0
        ? `Excluir a categoria "${titulo}"?\n\nIsso removerá ${qtd} serviço${qtd > 1 ? 's' : ''} junto com ela.`
        : `Excluir a categoria "${titulo}"?`;

    if (!confirm(aviso)) return;

    delete catalogo[cat];
    salvarCatalogo();

    const restantes = Object.keys(catalogo);
    categoriaAtual  = restantes.length > 0 ? restantes[0] : null;

    renderTabs();
    renderServicos();
}

function fecharModalCategoria() {
    document.getElementById('modal-categoria-overlay').classList.add('escondido');
    document.getElementById('form-categoria').reset();
}

document.getElementById('btn-nova-categoria').addEventListener('click', () => {
    document.getElementById('modal-categoria-overlay').classList.remove('escondido');
    document.getElementById('input-cat-nome').focus();
});

document.getElementById('modal-cat-fechar').addEventListener('click', fecharModalCategoria);
document.getElementById('btn-cat-cancelar').addEventListener('click', fecharModalCategoria);
document.getElementById('modal-categoria-overlay').addEventListener('click', e => {
    if (e.target.id === 'modal-categoria-overlay') fecharModalCategoria();
});

document.getElementById('form-categoria').addEventListener('submit', e => {
    e.preventDefault();
    const nome = document.getElementById('input-cat-nome').value.trim();
    if (!nome) return;

    let slug = gerarSlug(nome);
    if (catalogo[slug]) {
        let n = 2;
        while (catalogo[`${slug}-${n}`]) n++;
        slug = `${slug}-${n}`;
    }

    catalogo[slug] = { titulo: nome, itens: [] };
    salvarCatalogo();
    categoriaAtual = slug;
    fecharModalCategoria();
    renderTabs();
    renderServicos();
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
renderTabs();
renderServicos();
renderFotos();
