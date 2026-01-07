(async ()=>{
  try{
    const res = await fetch('http://localhost:3000/shop');
    console.log('status', res.status);
    const text = await res.text();
    console.log('body:', text);
  }catch(err){
    console.error('request error:', err);
  }
})();
