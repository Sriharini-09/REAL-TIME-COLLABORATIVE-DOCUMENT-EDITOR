import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';

const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  ['clean']
];

export default function Editor() {
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const [quill, setQuill] = useState(null);

  useEffect(() => {
    const q = new Quill(editorRef.current, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS }
    });
    setQuill(q);
  }, []);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000');

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!quill || !socketRef.current) return;

    const handleChange = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socketRef.current.emit('send-changes', delta);
    };

    quill.on('text-change', handleChange);

    socketRef.current.on('receive-changes', (delta) => {
      quill.updateContents(delta);
    });

    return () => {
      quill.off('text-change', handleChange);
    };
  }, [quill]);

  return <div ref={editorRef} style={{ height: '90vh' }} />;
}

