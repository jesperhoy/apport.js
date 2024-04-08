type Swap = "inner"|"replace"|"before"|"after"|"first"|"last"|"delete"|"none";

type ApportOptions={
  method?:"GET"|"POST"|"PUT"|"DELETE",
  url?:string,
  form?:string|HTMLFormElement,
  validate?:boolean,
  target?:string|HTMLElement,
  swap?:Swap,
  data?:string,
  trigger?:string,
  triggerName?:string
};


// tp=get/post/postback, cmd=cmd/url
async function Apport(fo:ApportOptions) {
  function ThrowThis(evtDet:ApportOptions,err:Error) {
    document.dispatchEvent(new CustomEvent("ap-error",{detail:{error:err,...evtDet}}));
    throw err;
  }
  
  let evtDet:ApportOptions={...fo};
  if(!fo.method) fo.method="GET";
  if(!fo.url) fo.url=window.location.href;

  let postBody:FormData|URLSearchParams;
  if(fo.method=="POST"||fo.method=="PUT") {
    if(fo.form && fo.form!=="none") {
      if(typeof fo.form=="string") fo.form=<HTMLFormElement>document.querySelector(fo.form);
      if(fo.validate && !fo.form.reportValidity()) return;
      postBody=new FormData(fo.form);
    } else {
      postBody=new FormData();
    }
    let HasFile=false;
    for(const kv of postBody) {
      if(kv[1] instanceof File) { 
        HasFile=true;
        break;
      }
    }  
    if(!HasFile) postBody=new URLSearchParams(<any>postBody);
  }

  document.dispatchEvent(new CustomEvent("ap-begin",{detail:evtDet}));

  let fo2:any={
    method:(fo.method),
    headers:{ "AP-Request":"true"},
    redirect:"error"
  }
  if(fo.data!==undefined) fo2.headers["AP-Data"]=encodeURI(JSON.stringify(fo.data));
  if(fo.trigger) fo2.headers["AP-Trigger"]=encodeURI(fo.trigger);
  if(fo.triggerName) fo2.headers["AP-Trigger-Name"]=encodeURI(fo.triggerName);
  if(fo.method=="POST"||fo.method=="PUT") fo2.body=postBody;

  let r;
  try {
    r = await fetch(fo.url,fo2);
  } catch(err) {
    ThrowThis(evtDet,err);
  }

  // ------ custom response headers: ----
  let hv;
  if(hv = r.headers.get("AP-redirect")) {
    location.href=hv;
    return;
  }
  if(r.headers.get("AP-reload")==="true") {
    location.reload();
    return;
  }

  if(r.status>=200 && r.status<=202) {
    // OK - insert received content
    if(hv=r.headers.get("AP-swap")) fo.swap=<Swap>hv;
    evtDet.swap=fo.swap;

    let tEl:HTMLElement;
    if(fo.swap!="none") {
      if(hv=r.headers.get("AP-target")) fo.target=hv;
      if(!fo.target) ThrowThis(evtDet,new Error("Missing target"));
      evtDet.target=fo.target;
      if(typeof fo.target==="string") {
        tEl=<HTMLElement>document.querySelector(fo.target);
        if(!tEl) ThrowThis(evtDet,new Error("Element of AP-Target header not found: " + fo.target));
      } else {
        tEl=fo.target;
      }
    }

    let frag:DocumentFragment;
    if(fo.swap!="none" && fo.swap!="delete") {
      let tmpl=document.createElement('template');
      tmpl.innerHTML=await r.text();
      frag=tmpl.content; 
      // we need to re-create all the script tags for these to run / be available
      let scripts=frag.querySelectorAll("script");
      for(const sc of scripts) {
        let ns=document.createElement("script");
        for(const attr of sc.attributes) ns.setAttribute(attr.name,attr.value);
        ns.innerHTML=sc.innerHTML;
        sc.parentNode.replaceChild(ns,sc);
      }
    }

    switch(fo.swap ?? 'inner') {
      case 'inner':
        tEl.innerHTML="";
        tEl.appendChild(frag);
        break;
      case 'first':
        if(tEl.firstChild) {
          tEl.insertBefore(frag,tEl.firstChild);
        } else {
          tEl.appendChild(frag);
        }
        break;
      case 'last':
        tEl.appendChild(frag);
        break;
      case 'replace':
        tEl.parentNode.replaceChild(frag,tEl);
        break;
      case 'before':
        tEl.parentNode.insertBefore(frag,tEl);
        break;
      case 'after':
        if(tEl.nextSibling) {
          tEl.parentNode.insertBefore(frag,tEl.nextSibling);
        } else {
          tEl.parentNode.appendChild(frag);
        }         
        break;
      case 'delete':
        tEl.remove();
        break;
      case 'none':
        // nothing
        break;
      default:
        ThrowThis(evtDet,new Error("Invalid swap value: " + fo.swap));
    } 

  } else if (r.status===204) {
    // 204 = no content = swap=none

  } else {
    // status code not supported
    ThrowThis(evtDet,new Error("Unsupported response status code received: " + r.status));
  }

  // ------ more custom response headers: ----
  if(hv=r.headers.get("AP-push-url")) {
    window.history.pushState(null,"",hv);
  }
  if(hv=r.headers.get("AP-replace-url")) {
    window.history.replaceState(null,"",hv);
  }
  if(hv=r.headers.get("AP-execute")) {
    let f=new Function("$opt", decodeURIComponent(hv));
    f(evtDet);
  }

  document.dispatchEvent(new CustomEvent("ap-done",{detail:evtDet}));
}


function HookUpElem(el:HTMLElement,tp:string) {
  function MakeOpt() {
    let rv:ApportOptions={}; 
    //-- method/url --
    rv.method=<any>tp.toUpperCase();
    let AttrVal=el.getAttribute("ap-"+tp);
    if(AttrVal) rv.url=AttrVal;  
    // -- ap-swap --
    rv.swap=<Swap>el.getAttribute("ap-swap") ?? undefined;
    // -- ap-validate --
    if(el.hasAttribute("ap-validate")) {
      rv.validate=el.getAttribute("ap-validate")!=="false";
    } else {
      rv.validate=el.tagName.toLowerCase()==="form";
    }
    // -- ap-target --
    rv.target= el.getAttribute("ap-target") ?? el;
    // -- ap-data --
    var dataJS=el.getAttribute("ap-data");
    if(dataJS) {
      let f=new Function("return " + dataJS);
      try {
        rv.data=f.call(el);
      } catch(err) {
        throw new Error("Error evaluating ap-data attribute value (\"" + dataJS + "\") on " + el.tagName + " element " + (el.id ? "#" + el.id :""),{cause:err});
      }
    }

    rv.trigger=el.id ?? undefined;
    rv.triggerName=el.getAttribute("name") ?? undefined;
    // form
    if(tp=="post"||tp=="put") rv.form=el.closest("form") ?? undefined;
    return rv; 
  }

  // -- ap-on --
  let EvtName:string=null;
  if(el.hasAttribute("ap-on")) {
    EvtName=el.getAttribute("ap-on");
  } else {
    let tagName = el.tagName.toLowerCase();
    EvtName=(["input","textarea","select"].indexOf(tagName)>=0 ? "change" : (tagName==="form" ? "submit" : "click"));
  }
  if(EvtName==="mount") {
    Apport(MakeOpt()); //TODO: maybe wait tick?
  } else {
    el.addEventListener(EvtName,(evt:Event)=>{evt.preventDefault();Apport(MakeOpt());});
  }
}

function HookUpTrimValidity(el:HTMLInputElement) {
  let HasTrim=el.hasAttribute("ap-trim");
  let HasValidity=el.hasAttribute("ap-validity");
  let vf=HasValidity ? new Function("return " + el.getAttribute("ap-validity")) : null;
  function Go() {
    if(HasTrim) el.value=el.value.trim();
    if(HasValidity) el.setCustomValidity(vf.call(el));
  }
  Go();
  el.addEventListener("change",Go);
}

let Elems=new Set<Element>();
let ElemsTV=new Set<Element>();
function ScanDom() {
  let NewElems=new Set<Element>(document.querySelectorAll("[ap-get],[ap-post],[ap-put],[ap-delete]"));
  for(const el of NewElems) { 
    if(Elems.has(el)) continue;
    for(const tp of ["get","post","put","delete"]) {
      if(el.hasAttribute("ap-"+tp)) HookUpElem(<HTMLElement>el,tp);
    }
  };
  Elems=NewElems;

  NewElems=new Set<Element>(document.querySelectorAll("[ap-trim],[ap-validity]"));
  for(const el of NewElems) { 
    if(ElemsTV.has(el)) continue;
    HookUpTrimValidity(<HTMLInputElement>el);
  };
  ElemsTV=NewElems;
}

let MyMO=new MutationObserver(ScanDom);
document.addEventListener('DOMContentLoaded', () => {
  ScanDom();
  MyMO.observe(document,{subtree:true,childList:true});
});

(<any>globalThis).Apport=Apport;
