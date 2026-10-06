(() => {
  'use strict';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
  function frequencies(prevalence,sensitivity,specificity){
    const p=clamp(prevalence,0,100)/100,se=clamp(sensitivity,0,100)/100,sp=clamp(specificity,0,100)/100;
    const tp=1000*p*se,fn=1000*p*(1-se),fp=1000*(1-p)*(1-sp),tn=1000*(1-p)*sp;
    return {tp,fn,fp,tn,ppv:tp+fp?tp/(tp+fp):null};
  }
  function receptor(concentration,kd,efficacy){
    const c=clamp(concentration,0,100),k=clamp(kd,.1,100),e=clamp(efficacy,0,1);
    const occupancy=c/(c+k);
    return {occupancy,response:e*occupancy};
  }
  window.ETO_MODELS={frequencies,receptor};
})();
