// Funções de gerenciamento do carrinho
function getCarrinho() {
    try {
        return JSON.parse(localStorage.getItem('carrinho')) || [];
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        return [];
    }
}

function saveCarrinho(carrinho) {
    try {
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        window.dispatchEvent(new CustomEvent('carrinhoAtualizado', { detail: carrinho }));
        renderizarCarrinho();
    } catch (error) {
        console.error('Erro ao salvar carrinho:', error);
    }
}

function mostrarFeedback(mensagem, tipo = 'sucesso') {
    const feedback = document.createElement('div');
    feedback.textContent = mensagem;
    feedback.classList.add('feedback-visual');
    feedback.style.position = 'fixed';
    feedback.style.top = '20px';
    feedback.style.right = '20px';
    feedback.style.padding = '10px 20px';
    feedback.style.backgroundColor = tipo === 'sucesso' ? '#28a745' : '#e74c3c';
    feedback.style.color = '#fff';
    feedback.style.borderRadius = '5px';
    feedback.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    feedback.style.zIndex = '1001';
    feedback.style.transition = 'opacity 0.5s ease';
    feedback.style.opacity = '1';

    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 500);
    }, 3000);
}

function adicionarAoCarrinho(produto) {
    fetch('/data/produtos.json')
        .then(res => {
            if (!res.ok) throw new Error('Erro ao carregar produtos.json');
            return res.json();
        })
        .then(produtos => {
            const produtoOriginal = produtos.find(p => p.id === produto.id);
            const carrinho = getCarrinho();
            const existente = carrinho.find(p => p.id === produto.id);

            if (existente) {
                if (existente.quantidade + 1 <= produtoOriginal.estoque) {
                    existente.quantidade++;
                    saveCarrinho(carrinho);
                    console.log('Quantidade atualizada:', existente);
                    mostrarFeedback(`${produto.nome} atualizado no carrinho!`, 'sucesso');
                } else {
                    mostrarFeedback('Quantidade máxima atingida para este produto.', 'erro');
                }
            } else if (produtoOriginal.estoque > 0) {
                produto.quantidade = 1;
                produto.parcelasEscolhidas = 1;
                carrinho.push(produto);
                saveCarrinho(carrinho);
                console.log('Produto adicionado:', produto);
                mostrarFeedback(`${produto.nome} adicionado ao carrinho!`, 'sucesso');
            } else {
                mostrarFeedback('Produto fora de estoque.', 'erro');
            }
        })
        .catch(error => {
            console.error('Erro ao verificar estoque:', error);
            mostrarFeedback('Erro ao adicionar ao carrinho.', 'erro');
        });
}

function renderizarCarrinho() {
    const carrinho = getCarrinho();
    const tabelaCorpo = document.querySelector('#tabela-carrinho tbody');
    const totalPreco = document.querySelector('#total-preco');
    const totalAVista = document.querySelector('#total-a-vista');
    const economia = document.querySelector('#economia');

    if (!tabelaCorpo || !totalPreco || !totalAVista || !economia) return;

    const fragment = document.createDocumentFragment();
    let totalParcelado = 0;
    let totalVista = 0;

    carrinho.forEach((item, index) => {
        const precoOriginal = item.preco / 0.95;
        const precoAVista = item.preco;
        const precoParcelado = precoOriginal * item.quantidade;
        const valorParcela = precoParcelado / item.parcelasEscolhidas;
        totalParcelado += precoParcelado;
        totalVista += precoAVista * item.quantidade;

        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td><img src="${item.imagem}" alt="${item.nome}" class="carrinho-imagem">${item.nome}</td>
            <td>${precoFormatado(precoOriginal)}</td>
            <td>
                <button class="btn-menos" data-index="${index}">-</button>
                ${item.quantidade}
                <button class="btn-mais" data-index="${index}">+</button>
            </td>
            <td>
                <select class="parcelas-select" data-index="${index}">
                    ${Array.from({ length: 12 }, (_, i) => i + 1).map(n => `
                        <option value="${n}" ${item.parcelasEscolhidas === n ? 'selected' : ''}>${n}x ${precoFormatado(valorParcela)}</option>
                    `).join('')}
                </select>
            </td>
            <td>${precoFormatado(precoParcelado)}</td>
            <td><button data-index="${index}" class="btn-remover">Remover</button></td>
        `;
        fragment.appendChild(linha);
    });

    tabelaCorpo.innerHTML = '';
    tabelaCorpo.appendChild(fragment);
    totalPreco.textContent = precoFormatado(totalParcelado);
    totalAVista.textContent = precoFormatado(totalVista);
    economia.textContent = precoFormatado(totalParcelado - totalVista);
}

function atualizarContadorCarrinho() {
    const carrinho = getCarrinho();
    const contador = document.querySelector('.carrinho-contador');
    if (contador) {
        const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        contador.textContent = totalItens > 0 ? totalItens : '';
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrinho();
    atualizarContadorCarrinho();

    const tabelaCorpo = document.querySelector('#tabela-carrinho tbody');
    if (tabelaCorpo) {
        tabelaCorpo.addEventListener('click', (e) => {
            const carrinho = getCarrinho();
            const index = parseInt(e.target.getAttribute('data-index'), 10);

            if (e.target.classList.contains('btn-remover')) {
                carrinho.splice(index, 1);
                saveCarrinho(carrinho);
            } else if (e.target.classList.contains('btn-mais')) {
                fetch('/data/produtos.json')
                    .then(res => res.json())
                    .then(produtos => {
                        const produtoOriginal = produtos.find(p => p.id === carrinho[index].id);
                        if (carrinho[index].quantidade + 1 <= produtoOriginal.estoque) {
                            carrinho[index].quantidade++;
                            saveCarrinho(carrinho);
                        } else {
                            alert('Quantidade máxima atingida para este produto.');
                        }
                    });
            } else if (e.target.classList.contains('btn-menos')) {
                if (carrinho[index].quantidade > 1) {
                    carrinho[index].quantidade--;
                    saveCarrinho(carrinho);
                } else {
                    carrinho.splice(index, 1);
                    saveCarrinho(carrinho);
                }
            }
        });

        tabelaCorpo.addEventListener('change', (e) => {
            if (e.target.classList.contains('parcelas-select')) {
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                const carrinho = getCarrinho();
                carrinho[index].parcelasEscolhidas = parseInt(e.target.value, 10);
                saveCarrinho(carrinho);
            }
        });
    }

    const finalizarCompra = document.getElementById('finalizar-compra');
    if (finalizarCompra) {
        finalizarCompra.addEventListener('click', () => {
            const carrinho = getCarrinho();
            if (carrinho.length > 0) {
                if (confirm('Deseja finalizar a compra?')) {
                    localStorage.removeItem('carrinho');
                    renderizarCarrinho();
                    const mensagem = document.createElement('p');
                    mensagem.textContent = 'Compra finalizada com sucesso!';
                    mensagem.style.color = 'green';
                    mensagem.style.textAlign = 'center';
                    mensagem.style.marginTop = '20px';
                    document.querySelector('.carrinho_container').appendChild(mensagem);
                    setTimeout(() => mensagem.remove(), 3000);
                }
            } else {
                alert('Seu carrinho está vazio!');
            }
        });
    }
});

window.addEventListener('carrinhoAtualizado', atualizarContadorCarrinho);