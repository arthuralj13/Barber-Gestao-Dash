// ===== SEED DE FUNCIONÁRIOS INICIAIS =====
const FUNCIONARIOS_INICIAIS = [
    { id: '1', nome: 'Admin',        email: 'admin@blackbil.com',        senha: 'admin123',    role: 'admin' },
    { id: '2', nome: 'Proprietário', email: 'proprietario@blackbil.com', senha: 'blackbil123', role: 'proprietario' }
];

(function inicializar() {
    if (!localStorage.getItem('blackbil_funcionarios')) {
        localStorage.setItem('blackbil_funcionarios', JSON.stringify(FUNCIONARIOS_INICIAIS));
    }
})();

// ===== TOGGLE SENHA =====
document.querySelectorAll('.btn-olho').forEach(btn => {
    btn.addEventListener('click', () => {
        const input      = document.getElementById(btn.dataset.target);
        const olhoAberto  = btn.querySelector('.olho-aberto');
        const olhoFechado = btn.querySelector('.olho-fechado');

        if (input.type === 'password') {
            input.type = 'text';
            olhoAberto.classList.add('escondido');
            olhoFechado.classList.remove('escondido');
        } else {
            input.type = 'password';
            olhoAberto.classList.remove('escondido');
            olhoFechado.classList.add('escondido');
        }
    });
});

// ===== SUBMIT LOGIN =====
document.getElementById('form-login').addEventListener('submit', e => {
    e.preventDefault();

    const email = document.getElementById('input-email').value.trim().toLowerCase();
    const senha = document.getElementById('input-senha').value;
    const erro  = document.getElementById('erro-login');

    const funcionarios = JSON.parse(localStorage.getItem('blackbil_funcionarios') || '[]');
    const funcionario  = funcionarios.find(f => f.email.toLowerCase() === email && f.senha === senha);

    if (!funcionario) {
        erro.classList.remove('escondido');
        return;
    }

    erro.classList.add('escondido');

    localStorage.setItem('blackbil_sessao', JSON.stringify({
        id:   funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        tipo: 'funcionario',
        role: funcionario.role
    }));

    window.location.href = '../agenda/agenda.html';
});
