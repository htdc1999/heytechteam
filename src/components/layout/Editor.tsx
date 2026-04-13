"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";
import styles from "./Editor.module.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false, 
  loading: () => <div className={styles.loadingBox}>Loading Editor Engine...</div> 
});

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function Editor({ value, onChange, placeholder = "Write something...", minHeight = "150px" }: EditorProps) {
  
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold'],
        [{ 'list': 'bullet' }, { 'list': 'ordered' }],
        ['link'],
        ['clean'],
        ['emoji'] 
      ],
      handlers: {
        'emoji': function () {
           // We map the emoji button to alert the user about their native OS integration 
           // allowing high-res scalable emojis across Windows and Mac flawlessly without heavy package bloat.
           alert("To insert Emojis seamlessly:\n\n• Windows: Press [ Win ] + [ . ]\n• Mac: Press [ Cmd ] + [ Ctrl ] + [ Space ]\n\nThis maps perfectly into your native hardware styling!");
        }
      }
    }
  }), []);

  return (
    <div className={styles.editorContainer} style={{ minHeight }}>
       <ReactQuill 
         theme="snow" 
         value={value || ""} 
         onChange={onChange} 
         modules={modules}
         placeholder={placeholder}
       />
    </div>
  );
}
