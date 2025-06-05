import React, { useState } from 'react';

export default function RenamePopup({ id, current = {}, onSave, onClose }) {
  const [name,  setName]  = useState(current.name  || '');
  const [color, setColor] = useState(current.color || '#ffffff');

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:999
    }}>
      <div style={{
        background:'white', padding:'1rem', borderRadius:6, minWidth:220
      }}>
        <h3 style={{marginBottom:12}}>{id}</h3>

        <label style={{fontSize:12}}>Name (optional)</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{display:'block', width:'100%', margin:'4px 0 12px 0'}}
        />

        <label style={{fontSize:12}}>Background colour</label>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          style={{display:'block', width:'100%', height:32, marginTop:4}}
        />

        <div style={{marginTop:16, textAlign:'right'}}>
          <button onClick={onClose} style={{marginRight:8}}>Cancel</button>
          <button
            onClick={()=>{
              onSave({ name: name.trim(), color });
              onClose();
            }}
            style={{background:'#0077ff', color:'white', padding:'4px 10px'}}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
