import { useEffect } from "react";

interface ContentProtectionOptions {
  enabled?: boolean;
  allowInputs?: boolean;
  showWarningToast?: boolean;
}

/**
 * Hook para proteção de conteúdo contra cópia
 * 
 * IMPORTANTE: Esta proteção é uma camada de dissuasão, não uma solução absoluta.
 * Usuários técnicos podem contornar essas medidas desabilitando JavaScript ou
 * usando ferramentas de desenvolvedor. Para proteção real de conteúdo sensível,
 * considere soluções server-side ou DRM.
 */
export function useContentProtection(options: ContentProtectionOptions = {}) {
  const { 
    enabled = true, 
    allowInputs = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    // Elementos que devem permitir interação normal
    const isInteractiveElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      
      const tagName = target.tagName.toLowerCase();
      const interactiveTags = ['input', 'textarea', 'select', 'button', 'a'];
      
      // Verifica se é um elemento interativo ou está dentro de um
      if (interactiveTags.includes(tagName)) return true;
      
      // Verifica se tem role interativo
      const role = target.getAttribute('role');
      if (role && ['textbox', 'button', 'link', 'menuitem', 'option'].includes(role)) return true;
      
      // Verifica se é editável
      if (target.isContentEditable) return true;
      
      // Verifica se está dentro de um formulário com input focado
      const activeElement = document.activeElement;
      if (activeElement && interactiveTags.includes(activeElement.tagName.toLowerCase())) return true;
      
      // Verifica ancestrais
      const closestInteractive = target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="textbox"]');
      return !!closestInteractive;
    };

    // Bloquear menu de contexto (clique direito)
    const handleContextMenu = (e: MouseEvent) => {
      if (allowInputs && isInteractiveElement(e.target)) return;
      e.preventDefault();
    };

    // Bloquear seleção de texto
    const handleSelectStart = (e: Event) => {
      if (allowInputs && isInteractiveElement(e.target)) return;
      e.preventDefault();
    };

    // Bloquear cópia
    const handleCopy = (e: ClipboardEvent) => {
      if (allowInputs && isInteractiveElement(e.target)) return;
      e.preventDefault();
    };

    // Bloquear recortar
    const handleCut = (e: ClipboardEvent) => {
      if (allowInputs && isInteractiveElement(e.target)) return;
      e.preventDefault();
    };

    // Bloquear atalhos de teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      
      // Permitir atalhos em elementos interativos
      if (allowInputs && isInteractiveElement(target)) return;

      // Bloquear Ctrl+C, Ctrl+X, Ctrl+A (Copiar, Recortar, Selecionar Tudo)
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'x', 'a'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          return;
        }
        
        // Bloquear Ctrl+U (View Source)
        if (e.key.toLowerCase() === 'u') {
          e.preventDefault();
          return;
        }
        
        // Bloquear Ctrl+Shift+I (DevTools)
        if (e.shiftKey && e.key.toLowerCase() === 'i') {
          e.preventDefault();
          return;
        }
        
        // Bloquear Ctrl+Shift+J (Console)
        if (e.shiftKey && e.key.toLowerCase() === 'j') {
          e.preventDefault();
          return;
        }
        
        // Bloquear Ctrl+Shift+C (Inspect Element)
        if (e.shiftKey && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          return;
        }
      }

      // Bloquear F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
    };

    // Bloquear arrastar elementos
    const handleDragStart = (e: DragEvent) => {
      if (allowInputs && isInteractiveElement(e.target)) return;
      e.preventDefault();
    };

    // Adicionar event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    // Adicionar CSS para bloquear seleção
    const styleId = 'content-protection-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      /* Proteção contra seleção de texto */
      body:not(input):not(textarea):not(select):not([contenteditable="true"]) {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Permitir seleção em inputs e textareas */
      input, textarea, select, [contenteditable="true"], [role="textbox"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      /* Desabilitar arrastar imagens */
      img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
        pointer-events: auto;
      }
    `;

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      
      // Remover estilos
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, [enabled, allowInputs]);
}
