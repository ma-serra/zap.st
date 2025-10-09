import JSZip from 'jszip';
import { parseString } from 'whatsapp-chat-parser';
import { DateBounds, ExtractedFile, IndexedMessage } from '../types';
import { UniqueIdGenerator } from './unique-id-generator';

const getMimeType = (fileName: string) => {
  if (/\.jpe?g$/.test(fileName)) return 'image/jpeg';
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.gif')) return 'image/gif';
  if (fileName.endsWith('.webp')) return 'image/webp';
  if (fileName.endsWith('.svg')) return 'image/svg+xml';

  if (fileName.endsWith('.mp4')) return 'video/mp4';
  if (fileName.endsWith('.webm')) return 'video/webm';

  if (fileName.endsWith('.mp3')) return 'audio/mpeg';
  if (fileName.endsWith('.m4a')) return 'audio/mp4';
  if (fileName.endsWith('.wav')) return 'audio/wav';
  if (fileName.endsWith('.opus')) return 'audio/ogg';

  return null;
};

const showError = (message: string, err?: Error) => {
  console.error(err || message); // eslint-disable-line no-console
  alert(message); // eslint-disable-line no-alert
};

const readChatFile = (zipData: JSZip) => {
  const chatFile = zipData.file('_chat.txt');

  if (chatFile) return chatFile.async('string');

  const chatFiles = zipData.file(/.*(?:chat|whatsapp).*\.txt$/i);

  if (!chatFiles.length) {
    return Promise.reject(new Error('No txt files found in archive'));
  }

  const chatFilesSorted = chatFiles.sort(
    (a, b) => a.name.length - b.name.length,
  );

  return chatFilesSorted[0].async('string');
};

const replaceEncryptionMessageAuthor = (messages: IndexedMessage[]) =>
  messages.map((message, i) => {
    // Substituir mensagens de criptografia
    if (
      message.message.includes('end-to-end') ||
      message.message.includes('criptografia') ||
      message.message.includes('protegidas') ||
      message.message.toLowerCase().includes('encryption')
    ) {
      return {
        ...message,
        author: null,
        message:
          'App criado para organizar o arquivo gerado pelo WhatsApp ao exportar conversa com mídia.',
      };
    }

    // Substituir mensagens de criação de grupo
    if (
      message.message.includes('created group') ||
      message.message.includes('criou o grupo') ||
      message.message.includes('criou este grupo') ||
      (message.message.toLowerCase().includes('created') &&
        message.message.toLowerCase().includes('group'))
    ) {
      return { ...message, message: 'by Serra & Tuaf Advogados' };
    }

    return message;
  });

const extractFile = (file: FileReader['result']) => {
  if (!file) return null;
  if (typeof file === 'string') return file;

  const jszip = new JSZip();

  return jszip.loadAsync(file);
};

const fileToText = (file: ExtractedFile) => {
  if (!file) return Promise.resolve('');
  if (typeof file === 'string') return Promise.resolve(file);

  return readChatFile(file).catch((err: Error) => {
    // eslint-disable-next-line no-alert
    alert(err);
    return Promise.resolve('');
  });
};

function messagesFromFile(file: ExtractedFile, isAnonymous = false) {
  return fileToText(file).then(text => {
    const uniqueIdGenerator = new UniqueIdGenerator();
    const parsed = parseString(text, {
      parseAttachments: file instanceof JSZip,
    }).map(({ author, ...msg }, index) => ({
      ...msg,
      author:
        author && isAnonymous
          ? `User ${uniqueIdGenerator.getId(author)}`
          : author,
      index,
    }));

    return replaceEncryptionMessageAuthor(parsed);
  });
}

function participantsFromMessages(messages: IndexedMessage[]) {
  const set = new Set<string>();

  messages.forEach(m => {
    if (m.author) set.add(m.author);
  });

  return Array.from(set);
}

function getISODateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function extractStartEndDatesFromMessages(
  messages: IndexedMessage[],
): DateBounds {
  const start = messages[0]?.date ?? new Date();
  const end = messages.at(-1)?.date ?? new Date();

  return { start, end };
}

function filterMessagesByDate(
  messages: IndexedMessage[],
  startDate: Date,
  endDate: Date,
) {
  return messages.filter(
    message => message.date >= startDate && message.date <= endDate,
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function generateCompleteHTML(
  messages: IndexedMessage[],
  extractedFile: ExtractedFile,
  activeUser: string,
): Promise<string> {
  const fileName = (window as any).uploadedFileName || 'chat.html';

  // Função para capturar DOM real e estilos computados
  const captureRealDOM = (): string => {
    try {
      // Encontrar o container das mensagens na interface React
      const messageContainer = document.querySelector(
        '[data-testid="message-list"], .message-list, ul',
      ) as HTMLElement;

      if (!messageContainer) {
        console.warn('Container de mensagens não encontrado, usando fallback');
        return '';
      }

      // Capturar todos os estilos computados
      const captureComputedStyles = (element: Element): string => {
        const computedStyle = window.getComputedStyle(element);
        let styles = '';

        // Propriedades CSS mais importantes para layout
        const importantProps = [
          'display',
          'position',
          'top',
          'right',
          'bottom',
          'left',
          'width',
          'height',
          'max-width',
          'max-height',
          'min-width',
          'min-height',
          'margin',
          'margin-top',
          'margin-right',
          'margin-bottom',
          'margin-left',
          'padding',
          'padding-top',
          'padding-right',
          'padding-bottom',
          'padding-left',
          'border',
          'border-radius',
          'box-shadow',
          'background',
          'background-color',
          'background-image',
          'color',
          'font-family',
          'font-size',
          'font-weight',
          'line-height',
          'text-align',
          'vertical-align',
          'white-space',
          'word-wrap',
          'overflow-wrap',
          'flex',
          'flex-direction',
          'flex-wrap',
          'justify-content',
          'align-items',
          'align-self',
          'opacity',
          'transform',
          'transition',
        ];

        for (const prop of importantProps) {
          const value = computedStyle.getPropertyValue(prop);
          if (value && value !== 'initial' && value !== 'normal') {
            styles += `${prop}: ${value}; `;
          }
        }

        return styles;
      };

      // Clonar e processar o DOM
      const clonedContainer = messageContainer.cloneNode(true) as HTMLElement;

      // Aplicar estilos inline em todos os elementos
      const applyInlineStyles = (element: Element) => {
        const styles = captureComputedStyles(element);
        if (styles) {
          (element as HTMLElement).style.cssText = styles;
        }

        // Processar filhos recursivamente
        Array.from(element.children).forEach(applyInlineStyles);
      };

      applyInlineStyles(clonedContainer);

      return clonedContainer.outerHTML;
    } catch (error) {
      console.error('Erro ao capturar DOM real:', error);
      return '';
    }
  };

  // Função para converter arquivo para base64
  const fileToBase64 = async (fileName: string): Promise<string | null> => {
    if (!extractedFile || typeof extractedFile === 'string') return null;

    const file = extractedFile.files[fileName];
    if (!file) return null;

    try {
      const data = await file.async('base64');
      const mimeType = getMimeType(fileName) || 'application/octet-stream';
      return `data:${mimeType};base64,${data}`;
    } catch {
      return null;
    }
  };

  // Tentar capturar DOM real primeiro
  let realDOMHTML = captureRealDOM();

  // Se não conseguiu capturar o DOM real, usar fallback melhorado
  if (!realDOMHTML) {
    console.log('Usando fallback para geração de HTML');

    // Cores dos autores (igual ao React)
    const authorColors = [
      '#1f7aec',
      '#fe7c7f',
      '#6bcbef',
      '#fc644b',
      '#35cd96',
      '#e542a3',
      '#91ab01',
      '#ba33dc',
      '#ffa97a',
      '#029d00',
      '#dfb610',
    ];

    let messagesHTML = '';
    let previousAuthor = '';

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const isSystem = !message.author;
      const isActiveUser = message.author === activeUser;
      const sameAuthorAsPrevious =
        message.author === previousAuthor && !isSystem;
      const authorColor = message.author
        ? authorColors[message.author.length % authorColors.length]
        : '#1f7aec';

      let messageContent = '';

      if (message.attachment) {
        const attachmentData = await fileToBase64(message.attachment.fileName);
        const mimeType = getMimeType(message.attachment.fileName) || '';

        if (attachmentData) {
          if (mimeType.startsWith('image/')) {
            messageContent = `<img src="${attachmentData}" alt="${message.attachment.fileName}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 2px 0; display: block;" />`;
          } else if (mimeType.startsWith('video/')) {
            messageContent = `<video controls style="max-width: 100%; height: auto; border-radius: 8px; margin: 2px 0; display: block;"><source src="${attachmentData}" type="${mimeType}" /></video>`;
          } else if (mimeType.startsWith('audio/')) {
            messageContent = `<audio controls style="width: 100%; height: 32px; margin: 2px 0; display: block;"><source src="${attachmentData}" type="${mimeType}" /></audio>`;
          } else {
            messageContent = `<a href="${attachmentData}" download="${message.attachment.fileName}" style="color: #68bbe4; text-decoration: underline;">${message.attachment.fileName}</a>`;
          }
        } else {
          messageContent = `<em>Anexo: ${message.attachment.fileName}</em>`;
        }
      } else {
        messageContent = message.message
          .replace(
            /https?:\/\/[^\s]+/g,
            '<a href="$&" target="_blank" rel="noopener noreferrer" style="color: #68bbe4; text-decoration: underline;">$&</a>',
          )
          .replace(/\n/g, '<br>');
      }

      const itemStyle = `
        margin-top: ${sameAuthorAsPrevious ? '0.25rem' : '1rem'};
        margin-left: auto;
        margin-right: auto;
        ${isSystem ? 'text-align: center;' : ''}
        ${isActiveUser ? 'text-align: right;' : ''}
      `;

      const bubbleStyle = `
        display: inline-flex;
        padding: 8px 10px;
        border-radius: 6px;
        box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
        position: relative;
        background-color: ${isSystem ? '#fff5c4' : isActiveUser ? '#ddf7c8' : 'white'};
        ${window.innerWidth <= 699 ? 'flex-direction: column;' : ''}
        ${window.innerWidth >= 700 ? 'max-width: 65%;' : ''}
        text-align: left;
      `;

      messagesHTML += `
        <li style="${itemStyle}">
          <div style="${bubbleStyle}">
            <div style="position: absolute; font-size: 10px; padding-inline: 7px; border-radius: 99px; border: 1px solid rgba(0, 0, 0, 0.15); top: -0.5em; right: -0.5em; background-color: ${isSystem ? '#fff5c4' : isActiveUser ? '#ddf7c8' : 'white'}; opacity: 0; transition: opacity 0.3s ease;">
              ${(message.index + 1).toLocaleString('de-CH')}
            </div>
            <div style="flex: 1 1 auto;">
              ${!isSystem && !sameAuthorAsPrevious && message.author ? `<div style="margin-bottom: 0.25rem; font-weight: bold; font-size: 75%; color: ${authorColor};">${message.author}</div>` : ''}
              <div style="overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; white-space: pre-wrap;">${messageContent}</div>
            </div>
            ${
              !isSystem
                ? `<time datetime="${message.date.toISOString()}" style="flex: 0 0 auto; align-self: flex-end; margin-left: 1rem; white-space: nowrap; font-size: 75%; opacity: 0.6; ${window.innerWidth <= 699 ? 'margin-top: 0.25rem; margin-left: 0;' : ''}">${new Intl.DateTimeFormat(
                    'default',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    },
                  ).format(message.date)}</time>`
                : ''
            }
          </div>
        </li>
      `;

      previousAuthor = message.author || '';
    }

    realDOMHTML = `<ul style="padding: 0; list-style: none;">${messagesHTML}</ul>`;
  } else {
    // Processar áudios no DOM capturado para garantir que tenham base64
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = realDOMHTML;

    const audioElements = tempDiv.querySelectorAll('audio');
    for (const audio of audioElements) {
      const sources = audio.querySelectorAll('source');
      for (const source of sources) {
        const src = source.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          // Tentar encontrar o arquivo correspondente
          const fileName = src.split('/').pop() || '';
          const base64Data = await fileToBase64(fileName);
          if (base64Data) {
            source.setAttribute('src', base64Data);
          }
        }
      }
    }

    // Fazer o mesmo para imagens e vídeos
    const mediaElements = tempDiv.querySelectorAll('img, video source');
    for (const media of mediaElements) {
      const src = media.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const fileName = src.split('/').pop() || '';
        const base64Data = await fileToBase64(fileName);
        if (base64Data) {
          media.setAttribute('src', base64Data);
        }
      }
    }

    realDOMHTML = tempDiv.innerHTML;
  }

  // Capturar estilos CSS da página atual
  const capturePageStyles = (): string => {
    let allStyles = '';

    // Capturar estilos de todas as folhas de estilo
    for (const styleSheet of document.styleSheets) {
      try {
        if (styleSheet.cssRules) {
          for (const rule of styleSheet.cssRules) {
            allStyles += rule.cssText + '\n';
          }
        }
      } catch (e) {
        // Ignorar erros de CORS
      }
    }

    // Adicionar estilos base essenciais
    allStyles += `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        background-color: #e5ddd5;
        background-attachment: fixed;
        flex-grow: 1;
        padding: 0 1rem;
        min-height: 100vh;
      }
      @media (min-width: 700px) { body { padding: 0 10%; } }
      audio { width: 100% !important; height: 32px !important; display: block !important; }
      img, video { max-width: 100% !important; height: auto !important; border-radius: 8px !important; display: block !important; }
    `;

    return allStyles;
  };

  const pageStyles = capturePageStyles();

  // Template HTML final com DOM real e estilos capturados
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat WhatsApp - ${fileName.replace('.html', '')}</title>
    <style>
        ${pageStyles}
    </style>
</head>
<body>
    <div style="background: #07bc4c; color: white; padding: 15px 20px; font-weight: bold; font-size: 18px; text-align: center;">
        Chat WhatsApp - ${fileName.replace('.html', '')}
    </div>
    <div style="display: inline-flex; padding: 8px 10px; border-radius: 6px; box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2); text-align: center; background-color: #07bc4c; color: white; margin: 1rem auto; font-size: 12px;">
        Exportado em ${new Date().toLocaleString('pt-BR')} • Total de mensagens: ${messages.length}
    </div>
    ${realDOMHTML}
</body>
</html>`;

  return htmlTemplate;
}

function generateAudioTranscription(messages: IndexedMessage[]): string {
  const audioMessages = messages.filter(
    message =>
      message.attachment &&
      getMimeType(message.attachment.fileName)?.startsWith('audio/'),
  );

  if (audioMessages.length === 0) {
    return 'Nenhum áudio encontrado nesta conversa.';
  }

  let transcription = '='.repeat(60) + '\n';
  transcription += 'TRANSCRIÇÃO DE ÁUDIOS - WHATSAPP CHAT EXPORT\n';
  transcription += '='.repeat(60) + '\n\n';
  transcription += `Total de áudios encontrados: ${audioMessages.length}\n`;
  transcription += `Data de exportação: ${new Date().toLocaleString('pt-BR')}\n\n`;
  transcription += '='.repeat(60) + '\n\n';

  audioMessages.forEach((message, index) => {
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(message.date);

    transcription += `Áudio #${index + 1}\n`;
    transcription += '-'.repeat(40) + '\n';
    transcription += `Data/Hora: ${formattedDate}\n`;
    transcription += `Autor: ${message.author || 'Sistema'}\n`;
    transcription += `Arquivo: ${message.attachment?.fileName || 'N/A'}\n`;
    transcription += `Mensagem #${message.index + 1} no chat\n`;
    transcription += '\n';
  });

  transcription += '='.repeat(60) + '\n';
  transcription += 'FIM DA TRANSCRIÇÃO\n';
  transcription += '='.repeat(60) + '\n';

  return transcription;
}

export {
  getMimeType,
  showError,
  readChatFile,
  replaceEncryptionMessageAuthor,
  extractFile,
  fileToText,
  messagesFromFile,
  participantsFromMessages,
  getISODateString,
  extractStartEndDatesFromMessages,
  filterMessagesByDate,
  capitalize,
  generateCompleteHTML,
  generateAudioTranscription,
};
