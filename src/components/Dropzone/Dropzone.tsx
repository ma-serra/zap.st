import { useState, useRef, useEffect } from 'react';

import * as S from './style';

const preventDefaults = (e: React.DragEvent<HTMLFormElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

interface IDropzone {
  id: string;
  onFileUpload: (e: File) => void;
}

function Dropzone({ id, onFileUpload }: IDropzone) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDragEnterOverHandler = (e: React.DragEvent<HTMLFormElement>) => {
    preventDefaults(e);
    setIsHighlighted(true);
  };

  const onDragLeaveHandler = (e: React.DragEvent<HTMLFormElement>) => {
    preventDefaults(e);
    setIsHighlighted(false);
  };

  const onDropHandler = (e: React.DragEvent<HTMLFormElement>) => {
    preventDefaults(e);
    setIsHighlighted(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      (window as any).uploadedFileName = file.name;
      onFileUpload(file);
    }
  };

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      (window as any).uploadedFileName = file.name;
      onFileUpload(file);
    }
  };

  useEffect(() => {
    // setTimeout to steal the focus from MenuOpenButton (only on first render)
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  return (
    <form
      onDragEnter={onDragEnterOverHandler}
      onDragOver={onDragEnterOverHandler}
      onDragLeave={onDragLeaveHandler}
      onDrop={onDropHandler}
    >
      <S.Input
        id={id}
        type="file"
        accept="text/plain, application/zip"
        ref={inputRef}
        onChange={onChangeHandler}
      />
      <S.Label htmlFor={id} $isHighlighted={isHighlighted}>
        <S.P>
          Clique aqui para fazer upload de um arquivo ou arraste e solte na
          região tracejada (formatos suportados: txt, zip)
        </S.P>
      </S.Label>
    </form>
  );
}

export default Dropzone;
