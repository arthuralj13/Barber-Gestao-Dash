// --- Abas ---
const btnLogin    = document.getElementById("btn-login");
const btnCadastro = document.getElementById("btn-cadastro");
const formLogin   = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const formTitulo   = document.getElementById("form-titulo");
const formSubtitulo = document.getElementById("form-subtitulo");

btnLogin.addEventListener("click", () => {
    formLogin.classList.remove("escondido");
    formCadastro.classList.add("escondido");
    btnLogin.classList.add("ativa");
    btnCadastro.classList.remove("ativa");
    formTitulo.textContent = "Bem-vindo(a) de volta";
    formSubtitulo.textContent = "Acesse sua conta para agendar seu atendimento";
});

btnCadastro.addEventListener("click", () => {
    formCadastro.classList.remove("escondido");
    formLogin.classList.add("escondido");
    btnCadastro.classList.add("ativa");
    btnLogin.classList.remove("ativa");
    formTitulo.textContent = "Criar sua conta";
    formSubtitulo.textContent = "Junte-se ao Black Bil e agende com facilidade";
});

// --- Seletor de perfil ---
document.getElementById("perfil-cliente").addEventListener("click", () => {
    document.getElementById("perfil-cliente").classList.add("ativo");
    document.getElementById("perfil-funcionario").classList.remove("ativo");
});

document.getElementById("perfil-funcionario").addEventListener("click", () => {
    document.getElementById("perfil-funcionario").classList.add("ativo");
    document.getElementById("perfil-cliente").classList.remove("ativo");
});

// --- Toggle visibilidade de senha ---
document.querySelectorAll(".btn-olho").forEach(btn => {
    btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        const olhoAberto  = btn.querySelector(".olho-aberto");
        const olhoFechado = btn.querySelector(".olho-fechado");

        if (input.type === "password") {
            input.type = "text";
            olhoAberto.classList.add("escondido");
            olhoFechado.classList.remove("escondido");
        } else {
            input.type = "password";
            olhoAberto.classList.remove("escondido");
            olhoFechado.classList.add("escondido");
        }
    });
});

// --- Submit login ---
formLogin.addEventListener("submit", e => {
    e.preventDefault();
    window.location.href = "../agendamento/agendamento.html";
});

// --- Submit cadastro (valida senhas) ---
formCadastro.addEventListener("submit", e => {
    e.preventDefault();
    const senha = document.getElementById("senha-cad").value;
    const conf  = document.getElementById("senha-conf").value;
    const erro  = document.getElementById("erro-senha");

    if (senha !== conf) {
        erro.classList.remove("escondido");
        return;
    }

    erro.classList.add("escondido");
    window.location.href = "../agendamento/agendamento.html";
});
