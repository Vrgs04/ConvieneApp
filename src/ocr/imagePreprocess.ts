async function render(file:File,region:'card'|'fare'):Promise<Blob>{
 const bitmap=await createImageBitmap(file),portrait=bitmap.height/bitmap.width>1.3;
 const bounds=region==='fare'&&portrait
  ?{sx:.04,sy:.27,sw:.92,sh:.24}
  :portrait?{sx:.02,sy:.23,sw:.96,sh:.75}:{sx:0,sy:0,sw:1,sh:1};
 const sx=Math.round(bitmap.width*bounds.sx),sy=Math.round(bitmap.height*bounds.sy),sw=Math.round(bitmap.width*bounds.sw),sh=Math.round(bitmap.height*bounds.sh),scale=Math.max(1,Math.min(3,1800/sw));
 const canvas=document.createElement('canvas');canvas.width=Math.round(sw*scale);canvas.height=Math.round(sh*scale);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('No se pudo preparar la imagen.');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,canvas.width,canvas.height);bitmap.close();
 const image=ctx.getImageData(0,0,canvas.width,canvas.height),d=image.data;
 for(let i=0;i<d.length;i+=4){const gray=.299*d[i]+.587*d[i+1]+.114*d[i+2],contrast=Math.max(0,Math.min(255,(gray-128)*1.45+128));d[i]=d[i+1]=d[i+2]=contrast;}
 ctx.putImageData(image,0,0);return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo procesar la imagen.')),'image/png'));
}
export const preprocessForOCR=(file:File)=>render(file,'card');
export const preprocessFareForOCR=(file:File)=>render(file,'fare');
