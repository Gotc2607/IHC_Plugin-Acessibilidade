// 1. Função injetada na página para fazer a varredura (roda no contexto do site)
function inspecionarPagina() {
  const dados = {
    temTituloAba: document.title.length > 0,
    temH1: document.querySelectorAll('h1').length > 0,
    totalImagens: document.querySelectorAll('img').length,
    imagensSemAlt: Array.from(document.querySelectorAll('img')).filter(img => !img.hasAttribute('alt') || img.alt.trim() === '').length,
    inputsSemLabel: Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"])')).filter(input => {
      // Checa se o input tem um label associado ou aria-label
      return !input.labels?.length && !input.hasAttribute('aria-label');
    }).length
  };
  return dados;
}

// 2. Quando o popup abre, roda a automação
document.addEventListener('DOMContentLoaded', async () => {
  // Pega a aba ativa atual
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Executa o script na página
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: inspecionarPagina,
  }, (resultados) => {
    if (resultados && resultados[0] && resultados[0].result) {
      const dados = resultados[0].result;
      let feedback = "";

      // Heurística 1: Status do sistema (O usuário sabe onde está?)
      if (dados.temTituloAba) {
        document.getElementById('h1').checked = true;
        feedback += "✅ Tag <title> encontrada (ajuda na Visibilidade - H1).\n";
      } else {
        feedback += "❌ Tag <title> ausente (fere a Visibilidade - H1).\n";
      }

      // Heurística 4: Consistência e Padrões (Tem título principal?)
      if (dados.temH1) {
        document.getElementById('h4').checked = true;
        feedback += "✅ Tag <h1> principal encontrada (Padrões - H4).\n";
      } else {
        feedback += "❌ Nenhum <h1> encontrado na página (Padrões - H4).\n";
      }

      // Heurísticas 5 e 9: Prevenção/Recuperação de Erros (Acessibilidade)
      if (dados.imagensSemAlt === 0 && dados.totalImagens > 0) {
        feedback += "✅ Todas as imagens têm texto alternativo.\n";
      } else if (dados.imagensSemAlt > 0) {
        feedback += `❌ ${dados.imagensSemAlt} imagem(ns) sem atributo 'alt' (Prevenção de Erros - H5).\n`;
      }

      if (dados.inputsSemLabel > 0) {
        feedback += `❌ ${dados.inputsSemLabel} campo(s) de formulário sem Label (Prevenção de Erros - H5).\n`;
      } else {
        feedback += "✅ Formulários parecem ter labels.\n";
      }

      // Atualiza a caixinha de insights no HTML
      document.getElementById('auto-feedback').textContent = feedback;
    }
  });
});

// 3. Lógica do botão de Download (Mantida e melhorada)
document.getElementById('gerar-txt').addEventListener('click', () => {
  const heuristicas = [
    { id: 'h1', titulo: '1. Visibilidade do status do sistema' },
    { id: 'h2', titulo: '2. Compatibilidade entre o sistema e o mundo real' },
    { id: 'h3', titulo: '3. Controle e liberdade do usuário' },
    { id: 'h4', titulo: '4. Consistência e padrões' },
    { id: 'h5', titulo: '5. Prevenção de erros' },
    { id: 'h6', titulo: '6. Reconhecimento em vez de memorização' },
    { id: 'h7', titulo: '7. Flexibilidade e eficiência de uso' },
    { id: 'h8', titulo: '8. Estética e design minimalista' },
    { id: 'h9', titulo: '9. Ajudar usuários a reconhecer, diagnosticar e recuperar-se de erros' },
    { id: 'h10', titulo: '10. Ajuda e documentação' }
  ];

  let relatorio = "=== RELATÓRIO DE AVALIAÇÃO HEURÍSTICA HÍBRIDA ===\n\n";
  
  relatorio += "--- RESULTADO DA INSPEÇÃO ---\n";
  heuristicas.forEach(item => {
    const checkbox = document.getElementById(item.id);
    const marca = checkbox.checked ? "[X]" : "[ ]";
    relatorio += `${marca} ${item.titulo}\n`;
  });

  const feedbackAuto = document.getElementById('auto-feedback').textContent;
  relatorio += "\n--- INSIGHTS AUTOMÁTICOS DO SISTEMA ---\n";
  relatorio += feedbackAuto + "\n";

  const notes = document.getElementById('notes').value;
  relatorio += "\n--- OBSERVAÇÕES MANUAIS DO AVALIADOR ---\n";
  relatorio += notes ? notes : "Nenhuma observação registrada.";

  const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dataAtual = new Date().toISOString().slice(0,10);
  link.download = `relatorio_hibrido_${dataAtual}.txt`;
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});