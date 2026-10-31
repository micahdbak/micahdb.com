class l0{css_width=0;css_height=0;pixel_width=0;pixel_height=0;dpr=1;focused=!1;listeners=new Map;on(e,t){let n=this.listeners.get(e);if(n===void 0)n=new Set,this.listeners.set(e,n);let r=t;return n.add(r),()=>{n.delete(r)}}emit(e,t){let n=this.listeners.get(e);if(n===void 0)return;for(let r of n)r(t)}dispose(){this.listeners.clear()}}class ke extends l0{element;element_resize;written_width=0;written_height=0;on_pointer_move=(e)=>{this.emit("pointermove",this.point(e.clientX,e.clientY))};on_pointer_down=(e)=>{e.preventDefault();let t=this.point(e.clientX,e.clientY);this.emit("pointerdown",t),this.element.setPointerCapture(e.pointerId)};on_pointer_up=(e)=>{this.emit("pointerup",this.point(e.clientX,e.clientY))};on_pointer_cancel=()=>{this.emit("pointercancel",{})};on_pointer_leave=()=>{this.emit("pointerleave",{})};on_wheel=(e)=>{e.preventDefault();let t=e.deltaMode===1||e.deltaMode===2?e.deltaMode:0;this.emit("wheel",{delta_mode:t,delta_y:e.deltaY})};on_key_down=(e)=>{if(this.is_form_target(e.target))return;this.emit("keydown",this.key(e))};on_key_up=(e)=>{if(this.is_form_target(e.target))return;this.emit("keyup",this.key(e))};on_focus=()=>{this.focused=!0,this.emit("focus",{})};on_blur=()=>{this.focused=!1,this.emit("blur",{})};on_resize=()=>{this.resize()};on_context_menu=(e)=>{e.preventDefault()};constructor(e){super();if(this.element=e,!e.hasAttribute("tabindex"))e.tabIndex=0;this.resize(),this.element_resize=new ResizeObserver(()=>this.resize()),this.element_resize.observe(e),window.addEventListener("resize",this.on_resize),window.addEventListener("pointermove",this.on_pointer_move),window.addEventListener("keydown",this.on_key_down),window.addEventListener("keyup",this.on_key_up),window.addEventListener("blur",this.on_blur),e.addEventListener("pointerdown",this.on_pointer_down),e.addEventListener("pointerup",this.on_pointer_up),e.addEventListener("pointercancel",this.on_pointer_cancel),e.addEventListener("pointerleave",this.on_pointer_leave),e.addEventListener("wheel",this.on_wheel,{passive:!1}),e.addEventListener("contextmenu",this.on_context_menu),e.addEventListener("focus",this.on_focus),e.addEventListener("blur",this.on_blur)}dispose(){this.element_resize.disconnect(),window.removeEventListener("resize",this.on_resize),window.removeEventListener("pointermove",this.on_pointer_move),window.removeEventListener("keydown",this.on_key_down),window.removeEventListener("keyup",this.on_key_up),window.removeEventListener("blur",this.on_blur),this.element.removeEventListener("pointerdown",this.on_pointer_down),this.element.removeEventListener("pointerup",this.on_pointer_up),this.element.removeEventListener("pointercancel",this.on_pointer_cancel),this.element.removeEventListener("pointerleave",this.on_pointer_leave),this.element.removeEventListener("wheel",this.on_wheel),this.element.removeEventListener("contextmenu",this.on_context_menu),this.element.removeEventListener("focus",this.on_focus),this.element.removeEventListener("blur",this.on_blur),super.dispose()}resize(){let e=window.devicePixelRatio||1,t=this.element.clientWidth,n=this.element.clientHeight,r=t*e,o=n*e;if(t>0&&t===this.written_width&&n===this.written_height)return;if(t===this.css_width&&n===this.css_height&&e===this.dpr)return;this.css_width=t,this.css_height=n,this.pixel_width=r,this.pixel_height=o,this.dpr=e,this.element.width=r,this.element.height=o,this.written_width=r,this.written_height=o,this.emit("resize",{css_width:t,css_height:n,pixel_width:r,pixel_height:o,dpr:e})}point(e,t){let n=this.element.getBoundingClientRect(),r=e-n.left,o=t-n.top;return{x:r,y:o,inside:r>=0&&o>=0&&r<n.width&&o<n.height}}key(e){let t={key:e.key,ctrl:e.ctrlKey,alt:e.altKey,meta:e.metaKey,shift:e.shiftKey,repeat:e.repeat,default_prevented:!1,prevent_default:()=>{t.default_prevented=!0,e.preventDefault()}};return t}is_form_target(e){let t=e;return t!==null&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable)}}var k;(function(e){e[e.BLACK=0]="BLACK",e[e.RED=1]="RED",e[e.GREEN=2]="GREEN",e[e.ORANGE=3]="ORANGE",e[e.BLUE=4]="BLUE",e[e.MAGENTA=5]="MAGENTA",e[e.CYAN=6]="CYAN",e[e.GREY=7]="GREY",e[e.BRIGHT_BLACK=8]="BRIGHT_BLACK",e[e.BRIGHT_RED=9]="BRIGHT_RED",e[e.BRIGHT_GREEN=10]="BRIGHT_GREEN",e[e.YELLOW=11]="YELLOW",e[e.BRIGHT_BLUE=12]="BRIGHT_BLUE",e[e.BRIGHT_MAGENTA=13]="BRIGHT_MAGENTA",e[e.BRIGHT_CYAN=14]="BRIGHT_CYAN",e[e.WHITE=15]="WHITE"})(k||(k={}));var be=[[8,8,8],[237,51,59],[87,227,137],[255,120,0],[98,160,234],[145,65,172],[91,200,175],[192,192,192],[128,128,128],[246,97,81],[143,240,164],[255,163,72],[153,193,241],[220,138,221],[147,221,194],[244,244,244]];class oe{colours;constructor(e=[]){this.colours=e.map(([t,n,r])=>[t,n,r])}toFloats(){let e=new Float32Array(48);for(let t=0;t<16;t++){let[n=0,r=0,o=0]=this.colours[t]??be[t];e[t*3]=Ce(n),e[t*3+1]=Ce(r),e[t*3+2]=Ce(o)}return e}}function Ce(e){if(!Number.isFinite(e))return 0;return Math.max(0,Math.min(255,Math.round(e)))/255}function u0(e,t,n,r,o,s){if(n<=0||r<=0)return null;if(e<0||t<0||e>=n||t>=r)return null;return{row:Math.floor(t/r*o),col:Math.floor(e/n*s)}}function h0(e,t,n,r){switch(e){case 0:return n>0?t/n:0;case 1:return t;case 2:return t*r}return 0}function f0(e){switch(e){case"j":case"ArrowDown":return 1;case"k":case"ArrowUp":return-1;case"0":return-999999}return 0}var at=[[],[0,0,126,129,165,129,129,189,153,129,129,126,0,0,0,0],[0,0,126,255,219,255,255,195,231,255,255,126,0,0,0,0],[0,0,0,0,108,238,254,254,254,124,56,16,0,0,0,0],[0,0,0,0,16,56,124,254,254,124,56,16,0,0,0,0],[0,0,0,24,60,60,90,255,255,90,24,60,0,0,0,0],[0,0,0,16,56,124,254,254,238,84,16,56,0,0,0,0],[0,0,0,0,0,0,24,60,60,24,0,0,0,0,0,0],[255,255,255,255,255,255,231,195,195,231,255,255,255,255,255,255],[0,0,0,0,0,60,102,66,66,102,60,0,0,0,0,0],[255,255,255,255,255,195,153,189,189,153,195,255,255,255,255,255],[0,0,30,14,26,48,120,204,204,204,204,120,0,0,0,0],[0,0,60,102,102,102,102,60,24,126,24,24,0,0,0,0],[0,8,12,10,10,10,8,8,8,120,248,112,0,0,0,0],[0,16,24,20,18,26,22,18,18,114,242,98,14,30,28,0],[0,0,0,16,146,124,108,198,108,124,146,16,0,0,0,0],[0,0,0,128,192,224,248,254,248,224,192,128,0,0,0,0],[0,0,0,2,6,14,62,254,62,14,6,2,0,0,0,0],[0,0,16,56,124,214,16,16,214,124,56,16,0,0,0,0],[0,0,102,102,102,102,102,102,102,0,102,102,0,0,0,0],[0,0,127,219,219,219,219,123,27,27,27,27,0,0,0,0],[0,124,198,96,56,108,198,198,108,56,12,198,124,0,0,0],[0,0,0,0,0,0,0,0,254,254,254,254,0,0,0,0],[0,0,16,56,124,214,16,16,214,124,56,16,254,0,0,0],[0,0,16,56,124,214,16,16,16,16,16,16,0,0,0,0],[0,0,16,16,16,16,16,16,214,124,56,16,0,0,0,0],[0,0,0,0,16,24,12,254,12,24,16,0,0,0,0,0],[0,0,0,0,16,48,96,254,96,48,16,0,0,0,0,0],[0,0,0,0,0,0,192,192,192,254,0,0,0,0,0,0],[0,0,0,0,0,36,66,255,66,36,0,0,0,0,0,0],[0,0,0,0,16,56,56,124,124,254,254,0,0,0,0,0],[0,0,0,0,254,254,124,124,56,56,16,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,24,60,60,60,24,24,24,0,24,24,0,0,0,0],[0,102,102,34,34,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,108,108,254,108,108,254,108,108,0,0,0,0],[0,16,16,124,214,214,112,56,28,214,214,124,16,16,0,0],[0,0,96,146,150,108,24,48,108,210,146,12,0,0,0,0],[0,0,56,108,108,56,48,118,220,204,204,118,0,0,0,0],[0,24,24,8,16,0,0,0,0,0,0,0,0,0,0,0],[0,0,12,24,48,48,48,48,48,48,24,12,0,0,0,0],[0,0,48,24,12,12,12,12,12,12,24,48,0,0,0,0],[0,0,0,0,0,102,60,255,60,102,0,0,0,0,0,0],[0,0,0,0,0,24,24,126,24,24,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,48,48,16,32,0,0],[0,0,0,0,0,0,0,254,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,48,48,0,0,0,0],[0,0,0,2,6,12,24,48,96,192,128,0,0,0,0,0],[0,0,124,198,198,206,222,246,230,198,198,124,0,0,0,0],[0,0,24,56,120,24,24,24,24,24,24,126,0,0,0,0],[0,0,124,198,6,12,24,48,96,192,198,254,0,0,0,0],[0,0,124,198,6,6,60,6,6,6,198,124,0,0,0,0],[0,0,12,28,60,108,204,204,254,12,12,30,0,0,0,0],[0,0,254,192,192,192,252,6,6,6,198,124,0,0,0,0],[0,0,124,198,192,192,252,198,198,198,198,124,0,0,0,0],[0,0,254,198,6,6,12,24,48,48,48,48,0,0,0,0],[0,0,124,198,198,198,124,198,198,198,198,124,0,0,0,0],[0,0,124,198,198,198,198,126,6,6,198,124,0,0,0,0],[0,0,0,0,24,24,0,0,0,24,24,0,0,0,0,0],[0,0,0,0,24,24,0,0,0,24,24,8,16,0,0,0],[0,0,0,6,12,24,48,96,48,24,12,6,0,0,0,0],[0,0,0,0,0,126,0,0,126,0,0,0,0,0,0,0],[0,0,0,96,48,24,12,6,12,24,48,96,0,0,0,0],[0,0,124,198,198,6,12,24,24,0,24,24,0,0,0,0],[0,0,0,60,66,157,165,165,173,182,64,60,0,0,0,0],[0,0,56,108,198,198,198,254,198,198,198,198,0,0,0,0],[0,0,252,102,102,102,124,102,102,102,102,252,0,0,0,0],[0,0,124,198,198,192,192,192,192,198,198,124,0,0,0,0],[0,0,252,102,102,102,102,102,102,102,102,252,0,0,0,0],[0,0,254,102,98,104,120,120,104,98,102,254,0,0,0,0],[0,0,254,102,98,104,120,120,104,96,96,240,0,0,0,0],[0,0,124,198,198,192,192,206,198,198,198,126,0,0,0,0],[0,0,198,198,198,198,254,198,198,198,198,198,0,0,0,0],[0,0,60,24,24,24,24,24,24,24,24,60,0,0,0,0],[0,0,30,12,12,12,12,12,12,204,204,120,0,0,0,0],[0,0,230,102,102,108,120,120,108,102,102,230,0,0,0,0],[0,0,240,96,96,96,96,96,96,98,102,254,0,0,0,0],[0,0,130,198,238,254,254,214,198,198,198,198,0,0,0,0],[0,0,134,198,230,246,254,222,206,198,198,198,0,0,0,0],[0,0,124,198,198,198,198,198,198,198,198,124,0,0,0,0],[0,0,252,102,102,102,102,124,96,96,96,240,0,0,0,0],[0,0,124,198,198,198,198,198,198,214,222,124,6,0,0,0],[0,0,252,102,102,102,102,124,108,102,102,230,0,0,0,0],[0,0,124,198,198,96,56,12,6,198,198,124,0,0,0,0],[0,0,126,126,90,24,24,24,24,24,24,60,0,0,0,0],[0,0,198,198,198,198,198,198,198,198,198,124,0,0,0,0],[0,0,198,198,198,198,198,198,198,108,56,16,0,0,0,0],[0,0,198,198,198,198,198,214,254,238,198,130,0,0,0,0],[0,0,198,198,108,124,56,56,124,108,198,198,0,0,0,0],[0,0,102,102,102,102,60,24,24,24,24,60,0,0,0,0],[0,0,254,198,134,12,24,48,96,194,198,254,0,0,0,0],[0,0,60,48,48,48,48,48,48,48,48,60,0,0,0,0],[0,0,0,128,192,96,48,24,12,6,2,0,0,0,0,0],[0,0,60,12,12,12,12,12,12,12,12,60,0,0,0,0],[0,0,16,56,108,198,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0],[0,24,24,16,8,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,120,12,124,204,204,204,118,0,0,0,0],[0,0,224,96,96,124,102,102,102,102,102,124,0,0,0,0],[0,0,0,0,0,124,198,192,192,192,198,124,0,0,0,0],[0,0,28,12,12,124,204,204,204,204,204,118,0,0,0,0],[0,0,0,0,0,124,198,198,254,192,198,124,0,0,0,0],[0,0,28,54,48,124,48,48,48,48,48,120,0,0,0,0],[0,0,0,0,0,118,204,204,204,204,204,124,12,204,120,0],[0,0,224,96,96,108,118,102,102,102,102,230,0,0,0,0],[0,0,24,24,0,56,24,24,24,24,24,60,0,0,0,0],[0,0,12,12,0,28,12,12,12,12,12,12,204,204,120,0],[0,0,224,96,96,102,108,120,120,108,102,230,0,0,0,0],[0,0,56,24,24,24,24,24,24,24,24,60,0,0,0,0],[0,0,0,0,0,236,254,214,214,214,214,198,0,0,0,0],[0,0,0,0,0,220,102,102,102,102,102,102,0,0,0,0],[0,0,0,0,0,124,198,198,198,198,198,124,0,0,0,0],[0,0,0,0,0,220,102,102,102,102,102,124,96,96,240,0],[0,0,0,0,0,124,204,204,204,204,204,124,12,12,30,0],[0,0,0,0,0,222,118,96,96,96,96,240,0,0,0,0],[0,0,0,0,0,124,198,96,56,12,198,124,0,0,0,0],[0,0,16,48,48,252,48,48,48,48,52,24,0,0,0,0],[0,0,0,0,0,204,204,204,204,204,204,118,0,0,0,0],[0,0,0,0,0,198,198,198,198,108,56,16,0,0,0,0],[0,0,0,0,0,198,214,214,214,214,254,108,0,0,0,0],[0,0,0,0,0,198,198,108,56,108,198,198,0,0,0,0],[0,0,0,0,0,198,198,198,198,198,198,126,6,12,248,0],[0,0,0,0,0,254,140,24,48,96,194,254,0,0,0,0],[0,0,14,24,24,24,112,24,24,24,24,14,0,0,0,0],[0,0,24,24,24,24,0,0,24,24,24,24,0,0,0,0],[0,0,112,24,24,24,14,24,24,24,24,112,0,0,0,0],[0,0,118,220,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,16,56,108,198,198,198,254,0,0,0,0,0],[0,0,124,198,198,192,192,192,192,198,198,124,16,8,112,0],[0,0,204,204,0,204,204,204,204,204,204,118,0,0,0,0],[0,6,12,16,0,124,198,198,254,192,198,124,0,0,0,0],[0,48,120,204,0,120,12,124,204,204,204,118,0,0,0,0],[0,0,204,204,0,120,12,124,204,204,204,118,0,0,0,0],[0,192,96,16,0,120,12,124,204,204,204,118,0,0,0,0],[0,48,72,48,0,120,12,124,204,204,204,118,0,0,0,0],[0,0,0,0,0,124,198,192,192,192,198,124,16,8,112,0],[0,24,60,102,0,124,198,198,254,192,198,124,0,0,0,0],[0,0,198,198,0,124,198,198,254,192,198,124,0,0,0,0],[0,192,96,16,0,124,198,198,254,192,198,124,0,0,0,0],[0,0,102,102,0,56,24,24,24,24,24,60,0,0,0,0],[0,24,60,102,0,56,24,24,24,24,24,60,0,0,0,0],[0,192,96,16,0,56,24,24,24,24,24,60,0,0,0,0],[198,198,0,56,108,198,198,254,198,198,198,198,0,0,0,0],[56,68,56,56,108,198,198,254,198,198,198,198,0,0,0,0],[12,24,32,254,102,98,104,120,104,98,102,254,0,0,0,0],[0,0,0,0,0,124,18,114,158,144,146,124,0,0,0,0],[0,0,62,106,200,200,204,252,200,200,202,206,0,0,0,0],[0,24,60,102,0,124,198,198,198,198,198,124,0,0,0,0],[0,0,198,198,0,124,198,198,198,198,198,124,0,0,0,0],[0,192,96,16,0,124,198,198,198,198,198,124,0,0,0,0],[0,48,120,204,0,204,204,204,204,204,204,118,0,0,0,0],[0,192,96,16,0,204,204,204,204,204,204,118,0,0,0,0],[0,0,198,198,0,198,198,198,198,198,198,126,6,12,120,0],[198,198,0,124,198,198,198,198,198,198,198,124,0,0,0,0],[198,198,0,198,198,198,198,198,198,198,198,124,0,0,0,0],[0,0,16,16,124,214,208,208,214,124,16,16,0,0,0,0],[0,0,56,108,96,240,96,96,96,96,242,220,0,0,0,0],[0,0,102,102,102,60,24,126,24,126,24,24,0,0,0,0],[0,0,248,204,204,248,196,204,222,204,204,198,0,0,0,0],[0,0,14,27,24,24,126,24,24,24,24,24,24,216,112,0],[0,6,12,16,0,120,12,124,204,204,204,118,0,0,0,0],[0,6,12,16,0,56,24,24,24,24,24,60,0,0,0,0],[0,6,12,16,0,124,198,198,198,198,198,124,0,0,0,0],[0,6,12,16,0,204,204,204,204,204,204,118,0,0,0,0],[0,0,118,220,0,220,102,102,102,102,102,102,0,0,0,0],[118,220,0,134,198,230,246,254,222,206,198,198,0,0,0,0],[0,56,12,60,108,54,0,126,0,0,0,0,0,0,0,0],[0,0,60,102,102,60,0,126,0,0,0,0,0,0,0,0],[0,0,48,48,0,48,48,96,192,198,198,124,0,0,0,0],[0,0,0,0,0,0,0,254,192,192,192,0,0,0,0,0],[0,0,0,0,0,0,0,254,6,6,6,0,0,0,0,0],[0,96,224,100,108,120,48,96,220,182,12,24,62,0,0,0],[0,96,224,100,108,120,48,108,220,172,62,12,12,0,0,0],[0,0,24,24,0,24,24,24,60,60,60,24,0,0,0,0],[0,0,0,0,0,54,108,216,108,54,0,0,0,0,0,0],[0,0,0,0,0,216,108,54,108,216,0,0,0,0,0,0],[34,136,34,136,34,136,34,136,34,136,34,136,34,136,34,136],[85,170,85,170,85,170,85,170,85,170,85,170,85,170,85,170],[221,119,221,119,221,119,221,119,221,119,221,119,221,119,221,127],[24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24],[24,24,24,24,24,24,24,248,24,24,24,24,24,24,24,24],[24,24,24,24,24,248,24,248,24,24,24,24,24,24,24,24],[54,54,54,54,54,54,54,246,54,54,54,54,54,54,54,54],[0,0,0,0,0,0,0,254,54,54,54,54,54,54,54,54],[0,0,0,0,0,248,24,248,24,24,24,24,24,24,24,24],[54,54,54,54,54,246,6,246,54,54,54,54,54,54,54,54],[54,54,54,54,54,54,54,54,54,54,54,54,54,54,54,54],[0,0,0,0,0,254,6,246,54,54,54,54,54,54,54,54],[54,54,54,54,54,246,6,254,0,0,0,0,0,0,0,0],[54,54,54,54,54,54,54,254,0,0,0,0,0,0,0,0],[24,24,24,24,24,248,24,248,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,248,24,24,24,24,24,24,24,24],[24,24,24,24,24,24,24,31,0,0,0,0,0,0,0,0],[24,24,24,24,24,24,24,255,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,255,24,24,24,24,24,24,24,24],[24,24,24,24,24,24,24,31,24,24,24,24,24,24,24,24],[0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0],[24,24,24,24,24,24,24,255,24,24,24,24,24,24,24,24],[24,24,24,24,24,31,24,31,24,24,24,24,24,24,24,24],[54,54,54,54,54,54,54,55,54,54,54,54,54,54,54,54],[54,54,54,54,54,55,48,63,0,0,0,0,0,0,0,0],[0,0,0,0,0,63,48,55,54,54,54,54,54,54,54,54],[54,54,54,54,54,247,0,255,0,0,0,0,0,0,0,0],[0,0,0,0,0,255,0,247,54,54,54,54,54,54,54,54],[54,54,54,54,54,55,48,55,54,54,54,54,54,54,54,54],[0,0,0,0,0,255,0,255,0,0,0,0,0,0,0,0],[54,54,54,54,54,247,0,247,54,54,54,54,54,54,54,54],[24,24,24,24,24,255,0,255,0,0,0,0,0,0,0,0],[54,54,54,54,54,54,54,255,0,0,0,0,0,0,0,0],[0,0,0,0,0,255,0,255,24,24,24,24,24,24,24,24],[0,0,0,0,0,0,0,255,54,54,54,54,54,54,54,54],[54,54,54,54,54,54,54,63,0,0,0,0,0,0,0,0],[24,24,24,24,24,31,24,31,0,0,0,0,0,0,0,0],[0,0,0,0,0,31,24,31,24,24,24,24,24,24,24,24],[0,0,0,0,0,0,0,63,54,54,54,54,54,54,54,54],[54,54,54,54,54,54,54,255,54,54,54,54,54,54,54,54],[24,24,24,24,24,255,24,255,24,24,24,24,24,24,24,24],[24,24,24,24,24,24,24,248,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,31,24,24,24,24,24,24,24,24],[255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255],[0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255],[240,240,240,240,240,240,240,240,240,240,240,240,240,240,240,240],[15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15],[255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0],[0,0,0,0,0,116,220,200,200,200,220,118,0,0,0,0],[0,0,120,204,204,216,204,198,198,198,220,192,64,0,0,0],[0,0,254,98,96,96,96,96,96,96,96,240,0,0,0,0],[0,0,0,0,2,126,236,108,108,108,108,72,0,0,0,0],[0,0,254,194,96,48,24,48,96,192,194,254,0,0,0,0],[0,0,0,0,0,126,208,200,200,200,200,112,0,0,0,0],[0,0,0,0,0,204,204,204,204,204,204,248,128,128,0,0],[0,0,0,0,0,126,216,24,24,24,24,16,0,0,0,0],[0,0,56,16,124,214,214,214,214,124,16,56,0,0,0,0],[0,0,0,124,198,198,198,254,198,198,198,124,0,0,0,0],[0,0,124,198,198,198,198,198,108,40,40,238,0,0,0,0],[0,0,60,98,48,24,124,204,204,204,204,120,0,0,0,0],[0,0,0,0,0,110,219,219,219,118,0,0,0,0,0,0],[0,0,0,2,6,124,206,222,214,246,230,124,192,128,0,0],[0,0,0,0,0,60,96,192,248,192,96,60,0,0,0,0],[0,0,124,198,198,198,198,198,198,198,198,198,0,0,0,0],[0,0,0,0,254,0,0,254,0,0,254,0,0,0,0,0],[0,0,0,0,24,24,126,24,24,0,0,255,0,0,0,0],[0,0,0,96,48,24,12,24,48,96,0,254,0,0,0,0],[0,0,0,12,24,48,96,48,24,12,0,254,0,0,0,0],[0,0,14,27,27,24,24,24,24,24,24,24,24,24,24,24],[24,24,24,24,24,24,24,24,24,216,216,112,0,0,0,0],[0,0,0,0,24,24,0,126,0,24,24,0,0,0,0,0],[0,0,0,0,0,118,220,0,118,220,0,0,0,0,0,0],[0,56,108,108,56,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,48,48,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0],[0,15,12,12,12,12,12,236,108,108,60,28,0,0,0,0],[0,216,108,108,108,108,0,0,0,0,0,0,0,0,0,0],[0,56,76,12,24,48,124,0,0,0,0,0,0,0,0,0],[0,0,0,0,124,124,124,124,124,124,124,0,0,0,0,0]];function d0(e){let r=new Uint8Array(4096),o=32;for(let i=1;i<255;i++){let x=i%32,c=4*Math.floor(i/32),a=at[i];for(let l=0;l<4;l++){let u=((c+l)*32+x)*4;r.set(a.slice(l*4,l*4+4),u)}}let s=e.createTexture();return e.bindTexture(e.TEXTURE_2D,s),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.pixelStorei(e.UNPACK_ALIGNMENT,1),e.texImage2D(e.TEXTURE_2D,0,e.RGBA8UI,32,32,0,e.RGBA_INTEGER,e.UNSIGNED_BYTE,r),s}class S extends EventTarget{static CELL_WIDTH=8;static CELL_HEIGHT=16;host;gl;unsubscribers=[];wheel_px;width=0;height=0;rows=1;cols=1;actual_cell_height=0;actual_cell_width=0;mouse_owner="";mouse_row=void 0;mouse_col=void 0;mouse_down=!1;mouse_click=!1;mouse_down_row=void 0;mouse_down_col=void 0;palette;bitmap_font;user_font;class_name="";constructor(e,t,n={}){super();this.host=e,this.gl=t,this.wheel_px=0,this.palette=(n.palette??new oe(be)).toFloats(),this.bitmap_font=d0(t),this.user_font=null,this.resize(),this.unsubscribers.push(e.on("resize",()=>this.resize()),e.on("pointermove",(r)=>{this.movePointer(r.x,r.y)}),e.on("pointerdown",(r)=>{this.press(r.x,r.y)}),e.on("pointerup",()=>this.release(!0)),e.on("pointercancel",()=>this.release(!1)),e.on("pointerleave",()=>this.release(!1)),e.on("wheel",(r)=>{this.scroll(r.delta_mode,r.delta_y)}),e.on("keydown",(r)=>this.pressKey(r)),e.on("keyup",(r)=>this.releaseKey(r)),e.on("blur",()=>this.cancelPress()))}static from(e,t={}){let n=new ke(e),r=e.getContext("webgl2");if(!r)throw n.dispose(),Error("No WebGL2 context");return new S(n,r,t)}mouseAt(e,t,n,r){return this.mouse_row!==void 0&&this.mouse_col!==void 0&&this.mouse_row>=e&&this.mouse_row<e+n&&this.mouse_col>=t&&this.mouse_col<t+r}mouseDownAt(e,t,n,r){return this.mouse_down_row!==void 0&&this.mouse_down_col!==void 0&&this.mouse_down_row>=e&&this.mouse_down_row<e+n&&this.mouse_down_col>=t&&this.mouse_down_col<t+r}setPalette(e){this.palette.set(e.toFloats())}clear(){let e=this.gl;e.clearColor(this.palette[0],this.palette[1],this.palette[2],1),e.clear(e.COLOR_BUFFER_BIT),this.class_name=""}dispose(){for(let e of this.unsubscribers)e();this.unsubscribers.length=0,this.host.dispose()}resize(){let e=this.host,t=this.gl;this.width=e.pixel_width,this.height=e.pixel_height,t.viewport(0,0,this.width,this.height);let n=Math.max(S.CELL_HEIGHT/2,S.CELL_HEIGHT*e.dpr),r=Math.max(S.CELL_WIDTH/2,S.CELL_WIDTH*e.dpr),o=Math.round(Math.min(Math.max(1,this.height/n),256)),s=Math.round(Math.min(Math.max(1,this.width/r),1024));if(this.actual_cell_height=this.height/o,this.actual_cell_width=this.width/s,this.mouse_owner="",this.mouse_row=void 0,this.mouse_col=void 0,this.mouse_down=!1,this.mouse_click=!1,this.mouse_down_row=void 0,this.mouse_down_col=void 0,o!==this.rows||s!==this.cols)this.rows=o,this.cols=s,this.dispatchEvent(new Event("resize"))}movePointer(e,t){let n=u0(e,t,this.host.css_width,this.host.css_height,this.rows,this.cols);this.mouse_row=n?.row,this.mouse_col=n?.col}press(e,t){this.movePointer(e,t),this.mouse_down=!0,this.mouse_down_row=this.mouse_row,this.mouse_down_col=this.mouse_col}release(e){if(this.mouse_down=!1,e)this.mouse_click=!0}cancelPress(){this.mouse_down=!1,this.mouse_click=!1}scroll(e,t){let n=this.rows>0?this.host.css_height/this.rows:0;this.wheel_px+=h0(e,t,n,this.rows);let r=Math.trunc(this.wheel_px);if(r===0)return;this.wheel_px-=r,this.dispatchWheel(r)}pressKey(e){if(this.dispatchEvent(new CustomEvent("keydown",{detail:e})),e.default_prevented)return;let t=f0(e.key),n=this.host.focused||this.mouse_row!==void 0;if(t!==0&&n)e.prevent_default(),this.dispatchWheel(t)}releaseKey(e){this.dispatchEvent(new CustomEvent("keyup",{detail:e}))}dispatchWheel(e){this.dispatchEvent(new CustomEvent("wheel",{detail:{rows:e}}))}}var m0=`#version 300 es

in uint a_colour;
in uint a_char_code;

uniform int u_rows;
uniform int u_cols;
uniform vec3 u_palette[16];

out vec2 v_cell_coord;
out vec2 v_uv_coord;

flat out vec3 f_fg_colour;
flat out vec3 f_bg_colour;
flat out ivec2 f_glyph_coord;
flat out uint f_char_code;

void main() {
	int row = gl_InstanceID / u_cols;
	int col = gl_InstanceID % u_cols;

	if (a_colour == 0u && a_char_code == 0u) {
		// clipped: don't cover any pixels below this glyph
		// e.g., a previously rendered texture
		gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
		return;
	}

	// 240 = 0b11110000
	int colour = int(a_colour + uint(a_colour == 0u) * 240u);

	int fg_idx = int((colour >> 4) & 0xf);
	int bg_idx = int(colour & 0xf);

	f_fg_colour = u_palette[fg_idx];
	f_bg_colour = u_palette[bg_idx];

	// 32 glyph columns, 8 glyph rows
	int glyph_row = clamp(int(a_char_code / 32u), 0, 7);
	int glyph_col = clamp(int(a_char_code % 32u), 0, 31);

	// coordinate of a_char_code in u_bitmap_font
	// (note: there are 4 pixels per glyph, in a column; hence row * 4)
	f_glyph_coord = ivec2(glyph_col, glyph_row * 4);

	// used when checking whether to use u_user_font or not
	f_char_code = a_char_code;

	/* A glyph is made up of two triangles, six vertices:
	 *
	 *   0--2     ,5     0--2,5
	 *   | /  +  / |  =  |   |
	 *   1'     3--4    1,3--4
	 */

	int row_inc = int(gl_VertexID == 1 || gl_VertexID == 3 ||
			  gl_VertexID == 4);

	int col_inc = int(gl_VertexID == 2 || gl_VertexID == 4 ||
			  gl_VertexID == 5);

	v_cell_coord = vec2(float(col_inc), float(row_inc));

	row += row_inc;
	col += col_inc;

	v_uv_coord = vec2(float(glyph_col + col_inc) / 32.0,
			  float(glyph_row + row_inc) / 8.0);

	// position needs to be in [-1.0, 1.0]
	float ndc_x = 2.0 * float(col) / float(u_cols) - 1.0;
	float ndc_y = -2.0 * float(row) / float(u_rows) + 1.0;

	gl_Position = vec4(ndc_x, ndc_y, 0.0, 1.0);
}
`,p0=`#version 300 es

precision mediump float;

// Computes the mix value for a coordinate relative to pixels, that will
// snap to the center of the pixel if it is in the center 50% of it, and
// otherwise interpolate linearly outside of the center 50%.
float sharp_bilinear_weight(float coord) {
	// distance of coord to center of cooresponding pixel
	float center_dist = fract(coord) - 0.5;

	// the component of coord that is within 50% of the center of the pixel
	float center_comp = clamp(center_dist, -0.25, 0.25);

	// when center_dist is outside of the center 50% of the pixel, this
	// will be an interpolation between this pixel and its neighbour
	float interp_coord = floor(coord) + (center_dist - center_comp) * 2.0;

	// this will be 0 when coord is in the center 50% of the pixel
	return interp_coord - floor(coord);
}

float bit_value(uvec4 texel, int x, int y) {
	return float((texel[y] >> (7 - x)) & 1u);
}

float bitmap_glyph_value(
	mediump usampler2D bitmap,
	ivec2 glyph_coord,
	vec2 cell_coord
) {
	int block = clamp(int(floor(cell_coord.y * 4.0)), 0, 3);
	ivec2 texel_coord = ivec2(glyph_coord.x, glyph_coord.y + block);
	uvec4 texel = texelFetch(bitmap, texel_coord, 0);

	// each block is 8px wide
	float block_x = clamp(cell_coord.x * 8.0, 0.0, 7.0);

	// each cell is 4 blocks high, each block being 4px tall
	float block_y = clamp(cell_coord.y * 16.0 - float(block) * 4.0,
			      0.0, 3.0);

	float horiz_weight = sharp_bilinear_weight(block_x);
	float vert_weight = sharp_bilinear_weight(block_y);

	int x = clamp(int(block_x), 0, 7);
	int y = clamp(int(block_y), 0, 3);

	// get each bit
	float tl = bit_value(texel, x, y);
	float tr = bit_value(texel, x + 1, y);
	float bl = bit_value(texel, x, y + 1);
	float br = bit_value(texel, x + 1, y + 1);

	float top = mix(tl, tr, horiz_weight);
	float bot = mix(bl, br, horiz_weight);

	return mix(top, bot, vert_weight);
}


in vec2 v_cell_coord;
in vec2 v_uv_coord;

flat in vec3 f_fg_colour;
flat in vec3 f_bg_colour;
flat in ivec2 f_glyph_coord;
flat in uint f_char_code;

uniform mediump usampler2D u_bitmap_font;
uniform sampler2D u_user_font;
uniform bool u_use_user_font;

out vec4 frag_colour;

void main() {
	// 176U and 191U are the first and last box-drawing characters
	if (u_use_user_font && (f_char_code < 176U || f_char_code >= 224U)) {
		vec4 samp = texture(u_user_font, v_uv_coord);
		frag_colour = vec4(mix(f_bg_colour, f_fg_colour, samp.r), 1.0);
		return;
	}

	float value = bitmap_glyph_value(u_bitmap_font, f_glyph_coord,
					 v_cell_coord);
	frag_colour = vec4(mix(f_bg_colour, f_fg_colour, value), 1.0);
}
`,_0=`#version 300 es

#define SAMPLE_MODE	0u
#define GLYPHS_MODE	1u
#define BG_GLYPHS_MODE	2u

precision mediump float;

in uint a_row;
in uint a_col;
in uint a_mode;

uniform int u_row;
uniform int u_col;
uniform int u_rows;
uniform int u_cols;
uniform int u_canvas_rows;
uniform int u_canvas_cols;
uniform vec3 u_palette[16];
uniform sampler2D u_texture;

out vec2 v_cell_coord;
out vec2 v_tex_uv_coord; // sample mode
out vec2 v_font_uv_coord;

flat out uint f_mode;
flat out vec3 f_fg_colour;
flat out vec3 f_bg_colour;
flat out ivec2 f_glyph_coord;
flat out int f_char_code;

const vec3 dimensions[8] = vec3[](
	vec3(0.0, 0.0, 0.0),	// black (unused)
	vec3(1.0, 0.8, 0.8),	// red
	vec3(0.8, 1.0, 0.8),	// green
	vec3(1.0, 1.0, 0.8),	// yellow
	vec3(0.8, 0.8, 1.0),	// blue
	vec3(1.0, 0.8, 1.0),	// magenta
	vec3(0.8, 1.0, 1.0),	// cyan
	vec3(1.0, 1.0, 1.0)	// white
);

struct Dims {
	int dim1;
	int dim2;
	float ratio;
};

Dims getDims(vec3 colour) {
	float hi = max(max(colour.r, colour.g), colour.b);
	float lo = min(min(colour.r, colour.g), colour.b);

	// channels within two 8-bit steps read as grey, which has no second
	// dimension to dither against; normalize() would otherwise turn its
	// rounding error into a ratio that flips lone cells to a hue
	if (hi - lo < 2.0 / 255.0) {
		return Dims(7, 7, 0.0);
	}

	vec3 ncolour = normalize(colour);
	float d1 = 1000.0;
	float d2 = 1000.0;
	int dim1 = 0;
	int dim2 = 0;

	for (int i = 1; i < 8; i++) {
		float d = distance(ncolour, normalize(dimensions[i]));

		if (d < d1) {
			d2 = d1;
			dim2 = dim1;
			d1 = d;
			dim1 = i;
		} else if (d < d2) {
			d2 = d;
			dim2 = i;
		}
	}

	return Dims(dim1, dim2, d1 / (d1 + d2));
}

float getLum(vec3 colour, int dim) {
	vec3 dcolour = dimensions[dim];
	return dot(colour, dcolour) / dot(dcolour, dcolour);
}

struct Glyph {
	int char_code;
	int fg_idx;
	int bg_idx;
};

Glyph getGlyph(int dim, float lum) {
	//                        .   ,   -   :   ;   =   !   *   #   $   @
	int glyphs[12] = int[](0, 46, 44, 45, 58, 59, 61, 33, 42, 35, 36, 64);

	int fgs[2] = int[](dim, dim + 8);

	if (dim == 7) {
		fgs = int[](8, 15);
	}

	int layer = clamp(int(lum * 2.0), 0, 2);

	Glyph glyph;

	int glyph_idx = clamp(int(12.0 * lum), 0, 11);
	glyph.char_code = glyphs[glyph_idx];
	glyph.fg_idx = fgs[layer];
	glyph.bg_idx = 0;

	return glyph;
}

Glyph getBgGlyph(int dim, float lum) {
	//                        .   -   ,   :   ;   =   !   *   #   $   @
	int glyphs[12] = int[](0, 46, 45, 44, 58, 59, 61, 33, 42, 35, 36, 64);

	int fgs[3] = int[](dim, dim + 8, 15);
	int bgs[3] = int[](0, dim, dim + 8);

	int layer = clamp(int(lum * 3.0), 0, 2);

	// check if dimension is white
	if (dim == 7) {
		if (layer > 0) {
			// reverse the order of the glyphs
			glyphs = int[](64, 36, 35, 42, 33, 61, 59, 58, 44, 45,
				       46, 0);
		}

		fgs = int[](7, 0, 8);
		bgs = int[](0, 7, 15);
	}

	Glyph glyph;

	int glyph_idx = clamp(int(12.0 * (3.0 * lum - float(layer))), 0, 11);
	glyph.char_code = glyphs[glyph_idx];
	glyph.fg_idx = fgs[layer];
	glyph.bg_idx = bgs[layer];

	return glyph;
}

void main() {
	int origin_row = int(a_row);
	int origin_col = int(a_col);

	/* A glyph is made up of two triangles, six vertices:
	 *
	 *   0--2     ,5     0--2,5
	 *   | /  +  / |  =  |   |
	 *   1'     3--4    1,3--4
	 */

	int row_inc = int(gl_VertexID == 1 || gl_VertexID == 3 ||
			  gl_VertexID == 4);

	int col_inc = int(gl_VertexID == 2 || gl_VertexID == 4 ||
			  gl_VertexID == 5);

	v_cell_coord = vec2(float(col_inc), float(row_inc));

	int row = origin_row + row_inc;
	int col = origin_col + col_inc;

	v_tex_uv_coord = vec2(float(col) / float(u_cols),
			  float(row) / float(u_rows));

	// position needs to be in [-1.0, 1.0]
	float ndc_x = 2.0 * float(u_col + col) / float(u_canvas_cols) - 1.0;
	float ndc_y = -2.0 * float(u_row + row) / float(u_canvas_rows) + 1.0;

	gl_Position = vec4(ndc_x, ndc_y, 0.0, 1.0);

	f_mode = a_mode;

	// sample mode
	if (f_mode == SAMPLE_MODE) {
		// no more work to do
		return;
	}

	// dithered glyphs mode

	vec2 origin_uv_coord = vec2(float(origin_col) / float(u_cols),
				    float(origin_row) / float(u_rows));

	vec2 full_uv_cell = vec2(1.0 / float(u_cols), 1.0 / float(u_rows));
	vec4 samp = texture(u_texture, origin_uv_coord + 0.5 * full_uv_cell);
	vec3 colour = samp.rgb;

	// dithering
	float bayer[16] = float[](
		0.0, 0.5, 0.125, 0.625,
		0.75, 0.25, 0.875, 0.375,
		0.1875, 0.6875, 0.0625, 0.5625,
		0.9375, 0.4375, 0.8125, 0.3125
	);
	float bayer_val = bayer[int(origin_row) % 4 * 4 + int(origin_col) % 4];

	Dims dims = getDims(colour);
	int dim = (bayer_val < dims.ratio) ? dims.dim2 : dims.dim1;
	float lum = getLum(colour, dim);

	float dither = (bayer_val - 0.5) / 12.0;
	lum = clamp(lum + dither, 0.0, 1.0);

	Glyph glyph;

	if (f_mode == BG_GLYPHS_MODE) {
		glyph = getBgGlyph(dim, lum);
	} else {
		glyph = getGlyph(dim, lum);
	}

	f_fg_colour = u_palette[glyph.fg_idx];
	f_bg_colour = u_palette[glyph.bg_idx];

	// 32 glyph columns, 8 glyph rows
	int glyph_row = clamp(int(glyph.char_code / 32), 0, 7);
	int glyph_col = clamp(int(glyph.char_code % 32), 0, 31);

	// coordinate of char_code in u_bitmap_font
	f_glyph_coord = ivec2(glyph_col, glyph_row << 2);

	f_char_code = glyph.char_code;

	v_font_uv_coord = vec2(float(glyph_col + col_inc) / 32.0,
			       float(glyph_row + row_inc) / 8.0);
}
`,w0=`#version 300 es

precision mediump float;

// Computes the mix value for a coordinate relative to pixels, that will
// snap to the center of the pixel if it is in the center 50% of it, and
// otherwise interpolate linearly outside of the center 50%.
float sharp_bilinear_weight(float coord) {
	// distance of coord to center of cooresponding pixel
	float center_dist = fract(coord) - 0.5;

	// the component of coord that is within 50% of the center of the pixel
	float center_comp = clamp(center_dist, -0.25, 0.25);

	// when center_dist is outside of the center 50% of the pixel, this
	// will be an interpolation between this pixel and its neighbour
	float interp_coord = floor(coord) + (center_dist - center_comp) * 2.0;

	// this will be 0 when coord is in the center 50% of the pixel
	return interp_coord - floor(coord);
}

float bit_value(uvec4 texel, int x, int y) {
	return float((texel[y] >> (7 - x)) & 1u);
}

float bitmap_glyph_value(
	mediump usampler2D bitmap,
	ivec2 glyph_coord,
	vec2 cell_coord
) {
	int block = clamp(int(floor(cell_coord.y * 4.0)), 0, 3);
	ivec2 texel_coord = ivec2(glyph_coord.x, glyph_coord.y + block);
	uvec4 texel = texelFetch(bitmap, texel_coord, 0);

	// each block is 8px wide
	float block_x = clamp(cell_coord.x * 8.0, 0.0, 7.0);

	// each cell is 4 blocks high, each block being 4px tall
	float block_y = clamp(cell_coord.y * 16.0 - float(block) * 4.0,
			      0.0, 3.0);

	float horiz_weight = sharp_bilinear_weight(block_x);
	float vert_weight = sharp_bilinear_weight(block_y);

	int x = clamp(int(block_x), 0, 7);
	int y = clamp(int(block_y), 0, 3);

	// get each bit
	float tl = bit_value(texel, x, y);
	float tr = bit_value(texel, x + 1, y);
	float bl = bit_value(texel, x, y + 1);
	float br = bit_value(texel, x + 1, y + 1);

	float top = mix(tl, tr, horiz_weight);
	float bot = mix(bl, br, horiz_weight);

	return mix(top, bot, vert_weight);
}


#define SAMPLE_MODE 0u

in vec2 v_cell_coord;
in vec2 v_tex_uv_coord; // f_mode == 0
in vec2 v_font_uv_coord;

flat in uint f_mode;
flat in vec3 f_fg_colour;
flat in vec3 f_bg_colour;
flat in ivec2 f_glyph_coord;
flat in int f_char_code;

uniform mediump usampler2D u_bitmap_font;
uniform sampler2D u_texture; // f_mode == 0
uniform sampler2D u_user_font;
uniform bool u_use_user_font;

out vec4 frag_colour;

void main() {
	if (f_mode == SAMPLE_MODE) {
		frag_colour = texture(u_texture, v_tex_uv_coord);
		return;
	}

	vec3 fg = f_fg_colour;
	vec3 bg = f_bg_colour;

	// 176 and 191 are the first and last box-drawing characters
	if (u_use_user_font && (f_char_code < 176 || f_char_code >= 224)) {
		vec4 samp = texture(u_user_font, v_font_uv_coord);
		frag_colour = vec4(mix(bg, fg, samp.r), 1.0);
		return;
	}

	float value = bitmap_glyph_value(u_bitmap_font, f_glyph_coord,
					 v_cell_coord);
	frag_colour = vec4(mix(bg, fg, value), 1.0);
}
`;var g0=/\d/;function Y(e,t){if(e[t]!=="\\")return{kind:"text",chars:1};let n=e[t+1],r=e[t+2];if(n==="\\")return{kind:"text",chars:2};if(n==="a"&&g0.test(r??""))return lt(e,t,Number(r));if(n!==void 0&&"fFbB".includes(n)&&g0.test(r??""))return{kind:"colour",chars:3,attribute:n==="f"||n==="F"?"fg":"bg",bright:n==="F"||n==="B",num:Number(r)};return{kind:"text",chars:1}}function lt(e,t,n){if(e[t+3]!=="{")return{kind:"anchor",chars:3,group:n,options:null};let r=e.indexOf("}",t+4),o=e.indexOf(`
`,t+4);if(r===-1||o!==-1&&r>o)return{kind:"text",chars:1};let s=e.slice(t+4,r);return{kind:"anchor",chars:r-t+1,group:n,options:s===""?null:s}}function ve(e){for(let t=0;t<e.length;){let n=Y(e,t);if(n.kind!=="text"||n.chars!==1)return!0;t+=n.chars}return!1}var C;(function(e){e[e.WORD=0]="WORD",e[e.TRUNCATE=1]="TRUNCATE",e[e.HARD=2]="HARD"})(C||(C={}));var L=8;function Pe(e,t,n={}){if(t<=0)return{pieces:[],starts:[],source:[]};let r=n.raw===!0,o=n.wrap??C.WORD,s=ut(e),i=o===C.HARD?ft(s.text,t,r):ht(s.text,t,r,o===C.WORD);return{pieces:i.pieces,starts:i.starts,source:s.source}}function Se(e,t,n={}){return Pe(e,t,n).pieces}function ut(e){let t="",n=[];for(let r=0;r<e.length;){let o=Y(e,r);if(o.kind==="text"&&o.chars===1&&e[r]==="\\"&&e[r+1]===`
`){r+=2;continue}for(let s=0;s<o.chars;s++)t+=e[r+s],n.push(r+s);r+=o.chars}return{text:t,source:n}}function b0(e,t){while(t<e.length&&(e[t]===" "||e[t]==="\t"))t++;if(t<e.length&&e[t]===`
`)t++;if(t>=e.length)return-1;return t-1}function ht(e,t,n,r){let o=[],s=[],i=(l,u)=>{o.push(e.slice(l,u).trimEnd()),s.push(l)},x=0,c=0,a=-1;for(let l=0;l<e.length;l++){let u=e[l];if(!n){let h=Y(e,l);if(h.kind!=="text"){l+=h.chars-1;continue}if(h.chars===2)l++,u=e[l]}if(u===`
`){i(x,l),x=l+1,c=0,a=-1;continue}if(u==="\t"){let h=L-c%L;if(c+h>t){i(x,l);let d=r?b0(e,l+1):e.indexOf(`
`,l+1);if(d<0)return{pieces:o,starts:s};l=d,x=d+1,c=0,a=-1}else c+=h,a=l;continue}if(u===" ")a=l;if(c+1>t){if(!r){i(x,l);let h=e.indexOf(`
`,l+1);if(h<0)return{pieces:o,starts:s};l=h,x=h+1,c=0,a=-1;continue}if(a<0){i(x,l),x=l,c=0,l--;continue}i(x,a),l=b0(e,a),x=l+1,c=0,a=-1;continue}c++}if(x<e.length)o.push(e.slice(x)),s.push(x);return{pieces:o,starts:s}}function ft(e,t,n){let r=[],o=[],s="",i=0,x=0,c="";for(let a=0;a<e.length;){let l=e[a];if(l===`
`){r.push(s+c),o.push(i),s="",c="",x=0,i=a+1,a++;continue}if(n){if(x===t)r.push(s),o.push(i),s="",x=0,i=a;s+=l,x+=l==="\t"?Math.min(L-x%L,t-x):1,a++;continue}let u=Y(e,a),h=e.slice(a,a+u.chars);if(u.kind!=="text"){c+=h,a+=u.chars;continue}if(x===t)r.push(s),o.push(i),i=a-c.length,s=c,c="",x=0;else s+=c,c="";s+=h,x+=l==="\t"?Math.min(L-x%L,t-x):1,a+=u.chars}if(s!==""||c!==""||r.length===0)r.push(s+c),o.push(i);return{pieces:r,starts:o}}var Ie=0;for(let e=1;e<255;e++){let t=" ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ".codePointAt(e);if(t>Ie)Ie=t}var y0=Ie,E0=new Uint8Array(y0+1);for(let e=1;e<255;e++){let t=" ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ".codePointAt(e);E0[t]=e}function T0(e){if(e>y0)return 0;return E0[e]}var v0="░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀",dt="@",mt=" ☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ".replace(v0,dt.repeat(v0.length)),Be=32,pt=8;function _t(e,t,n,r){return-e.left>=0&&e.right<=t&&e.ascent<=n&&e.descent<=r}async function Fe(e,t){await document.fonts.load(t);let n=e.getContext("2d");n.font=t;let r=1,o=Math.ceil(n.measureText("A").width),s=[];for(let m=1;m<255;m++){let p=mt.slice(m,m+1),_=n.measureText(p);s.push({glyph:p,left:_.actualBoundingBoxLeft,right:_.actualBoundingBoxRight,ascent:_.actualBoundingBoxAscent,descent:_.actualBoundingBoxDescent})}let i=Math.ceil(Math.max(...s.map((m)=>m.ascent))),x=Math.ceil(Math.max(...s.map((m)=>m.descent))),c=Math.max(i+x,2*o),a=o+2*r,l=c+2*r,u=r+(c-(i+x))/2+i,h=u-r,d=c-h;e.width=a*Be,e.height=l*pt,n.font=t,n.fillStyle="black",n.fillRect(0,0,e.width,e.height),n.fillStyle="white";for(let[m,p]of s.entries()){let _=m+1,v=_%Be*a,E=Math.floor(_/Be)*l,g=p.left+p.right,b=p.ascent+p.descent;if(n.save(),n.beginPath(),n.rect(v,E,a,l),n.clip(),_t(p,o,h,d))n.fillText(p.glyph,v+r,E+u);else{let y=Math.min(1,o/g,c/b),T=(o-y*g)/2+y*p.left;n.translate(v+r+T,E+u),n.scale(y,y),n.fillText(p.glyph,0,0)}n.restore()}}class I{sourceText;wrappedText;data;rows;cols;anchors;visible_to_source;source_to_cell;source_to_cursor;last_source;constructor(e,t,n={}){this.sourceText=e;let r=Pe(e,t,n);this.wrappedText=r.pieces,this.rows=r.pieces.length,this.cols=this.rows>0?t:0,this.data=new Uint16Array(this.rows*this.cols),this.anchors={},this.visible_to_source=[],this.source_to_cell=[],this.source_to_cursor=[],this.last_source=-1,this.build(r,n.raw===!0)}build(e,t){let n=k.WHITE,r=k.BLACK,o=[];for(let[s,i]of e.pieces.entries()){let x=[];this.visible_to_source[s]=x;let c=0,a=(l,u)=>{let h=T0(l.codePointAt(0)??32),d=(n&15)<<4|r&15;if(h!==32||d!==0)this.data[s*this.cols+c]=d<<8|h;x[c]=u;let m={row:s,col:c};this.source_to_cell[u]=m,this.source_to_cursor[u]=m,this.last_source=u;for(let p of o)p.row=s,p.col=c,p.index=u;o=[],c++};for(let l=0;l<i.length;){let u=e.source[e.starts[s]+l];if(t&&i[l]==="\t"){let m=Math.min(L-c%L,Math.max(0,this.cols-c));for(let p=c;p<c+m;p++)x[p]=u;this.source_to_cursor[u]={row:s,col:c},c+=m,l++;continue}if(t){a(i[l],u),l++;continue}let h=Y(i,l);if(h.kind==="anchor"){let m={options:h.options,row:0,col:0,index:0},p=this.anchors[h.group]??[];p.push(m),this.anchors[h.group]=p,o.push(m),l+=h.chars;continue}if(h.kind==="colour"){let m=Math.min(h.num,7)+(h.bright?8:0);if(h.attribute==="fg")n=m;else r=m;l+=h.chars;continue}let d=i[l];if(d==="\t"){let m=Math.min(L-c%L,Math.max(0,this.cols-c));for(let p=c;p<c+m;p++)x[p]=u;this.source_to_cursor[u]={row:s,col:c},c+=m,l++;continue}a(d,u),l+=h.chars}}if(o.length>0){let s=Math.max(0,this.rows-1);for(let i of o)i.row=s,i.col=this.rowCols(s),i.index=e.source.length}}renderedCell(e){let t=this.source_to_cell[e];return t===void 0?null:{...t}}cursorCell(e){if(this.rows===0)return{row:0,col:0};let t=this.source_to_cursor[e];if(t!==void 0)return{...t};for(let r=Math.max(0,e);r<this.source_to_cursor.length;r++){let o=this.source_to_cursor[r];if(o!==void 0)return{...o}}let n=this.rows-1;return{row:n,col:this.rowCols(n)}}cursorIndex(e,t){let n=this.visible_to_source[e]??[],r=n[Math.max(0,Math.min(t,n.length-1))];if(r!==void 0)return r;for(let o=e+1;o<this.rows;o++){let s=this.visible_to_source[o]?.[0];if(s!==void 0)return s}return Math.max(0,this.last_source)}rowCols(e){return this.visible_to_source[e]?.length??0}spansFor(e,t){let n=[],r=Math.max(0,e),o=Math.min(t,this.source_to_cell.length);for(let s=r;s<o;s++){let i=this.source_to_cell[s];if(i===void 0)continue;let x=n[n.length-1];if(x!==void 0&&x.row===i.row)x.to=i.col+1;else n.push({row:i.row,from:i.col,to:i.col+1})}return n}mapCells(e,t){let n=this.data.slice(),r=Math.max(0,t?.row??0),o=Math.max(0,t?.col??0),s=Math.min(this.rows,(t?.row??this.rows)+(t?.rows??this.rows)),i=Math.min(this.cols,(t?.col??this.cols)+(t?.cols??this.cols));for(let c=r;c<s;c++)for(let a=o;a<i;a++){let l=c*this.cols+a;n[l]=e(n[l],c,a)}let x=Object.create(I.prototype);return Object.assign(x,this,{data:n}),x}}function Z(e,t,n){let r=e.createShader(e.VERTEX_SHADER);if(!r)throw Error("When creating vertex shader");if(e.shaderSource(r,t),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS))throw Error("When compiling vertex shader: "+e.getShaderInfoLog(r));let o=e.createShader(e.FRAGMENT_SHADER);if(!o)throw Error("When creating fragment shader");if(e.shaderSource(o,n),e.compileShader(o),!e.getShaderParameter(o,e.COMPILE_STATUS))throw Error("When compiling fragment shader: "+e.getShaderInfoLog(o));let s=e.createProgram();if(!s)throw Error("When creating GPU program");if(e.attachShader(s,r),e.attachShader(s,o),e.linkProgram(s),!e.getProgramParameter(s,e.LINK_STATUS))throw Error("When linking shader program: "+e.getProgramInfoLog(s));return s}function Q(e,t,n){let r={};for(let o of Object.keys(n)){let s=n[o],i=e.getAttribLocation(t,s);if(i<0)throw Error(`When getting attribute location for ${s}`);r[o]=i}return r}function ee(e,t,n){let r={};for(let o of Object.keys(n)){let s=n[o],i=e.getUniformLocation(t,s);if(!i)throw Error(`When getting uniform location for ${s}`);r[o]=i}return r}class se{gl_program;attributes;uniforms;vao;vbo;fbcon;resized;last_detail_text;detail_glyphs;canvas;detail_text;use_user_font;constructor(e){this.canvas=e;let t=e.gl;this.fbcon=new Uint16Array(0),this.last_detail_text="",this.detail_glyphs=null,this.detail_text="",this.gl_program=Z(t,m0,p0),this.attributes=Q(t,this.gl_program,{colour:"a_colour",char_code:"a_char_code"}),this.uniforms=ee(t,this.gl_program,{rows:"u_rows",cols:"u_cols",palette:"u_palette",bitmap_font:"u_bitmap_font",user_font:"u_user_font",use_user_font:"u_use_user_font"});let n=t.createVertexArray();if(this.vao=n,!n)throw Error("Could not create vertex array object");t.bindVertexArray(n);let r=t.createBuffer();if(this.vbo=r,!r)throw Error("Could not create vertex buffer");t.bindBuffer(t.ARRAY_BUFFER,r),t.vertexAttribIPointer(this.attributes.colour,1,t.UNSIGNED_BYTE,2,1),t.vertexAttribDivisor(this.attributes.colour,1),t.enableVertexAttribArray(this.attributes.colour),t.vertexAttribIPointer(this.attributes.char_code,1,t.UNSIGNED_BYTE,2,0),t.vertexAttribDivisor(this.attributes.char_code,1),t.enableVertexAttribArray(this.attributes.char_code),t.bindVertexArray(null),t.useProgram(this.gl_program),t.uniform1i(this.uniforms.rows,this.canvas.rows),t.uniform1i(this.uniforms.cols,this.canvas.cols),t.uniform1i(this.uniforms.bitmap_font,0),t.uniform1i(this.uniforms.user_font,1),t.uniform1i(this.uniforms.use_user_font,0),this.resized=!0,this.use_user_font=!1,this.canvas.addEventListener("resize",()=>{this.resized=!0})}blit(e,t,n){if(t.rows!==n.rows||t.cols!==n.cols){console.log("Terminal.blit: not blitting due to bad src or dst");return}if(t={...t},n={...n},t.row<0){let r=Math.abs(t.row);t.row=0,t.rows-=r,n.row+=r,n.rows-=r}if(t.col<0){let r=Math.abs(t.col);t.col=0,t.cols-=r,n.col+=r,n.cols-=r}if(n.row<0){let r=Math.abs(n.row);t.row+=r,t.rows-=r,n.row=0,n.rows-=r}if(n.col<0){let r=Math.abs(n.col);t.col+=r,t.cols-=r,n.col=0,n.cols-=r}if(n.row+n.rows>this.canvas.rows){let r=n.row+n.rows-this.canvas.rows;n.rows-=r,t.rows=n.rows}if(n.col+n.cols>this.canvas.cols){let r=n.col+n.cols-this.canvas.cols;n.cols-=r,t.cols=n.cols}for(let r=0;;r++){let o=r+t.row,s=r+n.row;if(o>=t.row+t.rows||s>=n.row+n.rows)break;let i=o*e.cols+t.col,x=s*this.canvas.cols+n.col;this.fbcon.set(e.data.subarray(i,i+t.cols),x)}}clear(){let e=this.canvas.gl;if(this.resized)this.resized=!1,e.useProgram(this.gl_program),e.uniform1i(this.uniforms.rows,this.canvas.rows),e.uniform1i(this.uniforms.cols,this.canvas.cols),this.fbcon=new Uint16Array(this.canvas.rows*this.canvas.cols);this.fbcon.fill(0),this.detail_text=""}draw(){if(this.last_detail_text!==this.detail_text)if(this.last_detail_text=this.detail_text,this.detail_text.length>0)this.detail_glyphs=new I("\\B0\\F7"+this.detail_text,this.detail_text.length,{wrap:C.TRUNCATE});else this.detail_glyphs=null;if(this.detail_text.length>0&&this.detail_glyphs!==null)this.blit(this.detail_glyphs,{row:0,col:0,rows:1,cols:this.detail_glyphs.cols},{row:this.canvas.rows-1,col:0,rows:1,cols:this.detail_glyphs.cols});let e=this.canvas.gl;if(e.useProgram(this.gl_program),e.uniform3fv(this.uniforms.palette,this.canvas.palette),e.bindBuffer(e.ARRAY_BUFFER,this.vbo),e.bufferData(e.ARRAY_BUFFER,this.fbcon,e.DYNAMIC_DRAW),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,this.canvas.bitmap_font),this.use_user_font)e.uniform1i(this.uniforms.use_user_font,1);if(this.canvas.user_font!==null)e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,this.canvas.user_font);else if(this.use_user_font)this.use_user_font=!1,e.uniform1i(this.uniforms.use_user_font,0);e.bindVertexArray(this.vao),e.drawArraysInstanced(e.TRIANGLES,0,6,this.canvas.rows*this.canvas.cols),e.bindVertexArray(null)}}var M;(function(e){e[e.SAMPLE=0]="SAMPLE",e[e.GLYPHS=1]="GLYPHS",e[e.BG_GLYPHS=2]="BG_GLYPHS",e[e.MIX=3]="MIX",e[e.ROWS=4]="ROWS",e[e.COLS=5]="COLS"})(M||(M={}));function wt(e,t,n){switch(e){case M.MIX:return(t+n)%2===0?M.SAMPLE:M.GLYPHS;case M.ROWS:return t%2===0?M.SAMPLE:M.GLYPHS;case M.COLS:return n%2===0?M.SAMPLE:M.GLYPHS;default:return e}}function ie(e,t,n){let r={data:new Uint32Array(e*t),rows:e,cols:t};for(let o=0;o<e*t;o++){let s=Math.floor(o/t),i=o%t,x=wt(n,s,i);r.data[o]=(s&255)<<24|(x&255)<<16|i&65535}return r}class xe{gl_program;attributes;uniforms;vao;vbo;resized;canvas;use_user_font;constructor(e){this.canvas=e;let t=e.gl;this.gl_program=Z(t,_0,w0),this.attributes=Q(t,this.gl_program,{row:"a_row",col:"a_col",mode:"a_mode"}),this.uniforms=ee(t,this.gl_program,{row:"u_row",col:"u_col",rows:"u_rows",cols:"u_cols",canvas_rows:"u_canvas_rows",canvas_cols:"u_canvas_cols",palette:"u_palette",bitmap_font:"u_bitmap_font",texture:"u_texture",user_font:"u_user_font",use_user_font:"u_use_user_font"});let n=t.createVertexArray();if(this.vao=n,!n)throw Error("Could not create vertex array object");t.bindVertexArray(n);let r=t.createBuffer();if(this.vbo=r,!r)throw Error("Could not create vertex buffer");t.bindBuffer(t.ARRAY_BUFFER,r),t.vertexAttribIPointer(this.attributes.row,1,t.UNSIGNED_BYTE,4,3),t.vertexAttribDivisor(this.attributes.row,1),t.enableVertexAttribArray(this.attributes.row),t.vertexAttribIPointer(this.attributes.mode,1,t.UNSIGNED_BYTE,4,2),t.vertexAttribDivisor(this.attributes.mode,1),t.enableVertexAttribArray(this.attributes.mode),t.vertexAttribIPointer(this.attributes.col,1,t.UNSIGNED_SHORT,4,0),t.vertexAttribDivisor(this.attributes.col,1),t.enableVertexAttribArray(this.attributes.col),t.bindVertexArray(null),t.useProgram(this.gl_program),t.uniform1i(this.uniforms.row,0),t.uniform1i(this.uniforms.col,0),t.uniform1i(this.uniforms.rows,0),t.uniform1i(this.uniforms.cols,0),t.uniform1i(this.uniforms.canvas_rows,this.canvas.rows),t.uniform1i(this.uniforms.canvas_cols,this.canvas.cols),t.uniform1i(this.uniforms.bitmap_font,0),t.uniform1i(this.uniforms.texture,1),t.uniform1i(this.uniforms.user_font,2),t.uniform1i(this.uniforms.use_user_font,0),this.resized=!1,this.use_user_font=!1,this.canvas.addEventListener("resize",()=>{this.resized=!0})}draw(e,t,n){if(e.rows!==n.rows||e.cols!==n.cols){console.log("Renderer.draw: skipping due to bad tglyphs or dst");return}let r=this.canvas.gl;if(r.useProgram(this.gl_program),r.uniform3fv(this.uniforms.palette,this.canvas.palette),this.resized)this.resized=!1,r.uniform1i(this.uniforms.canvas_rows,this.canvas.rows),r.uniform1i(this.uniforms.canvas_cols,this.canvas.cols);if(r.uniform1i(this.uniforms.row,n.row),r.uniform1i(this.uniforms.col,n.col),r.uniform1i(this.uniforms.rows,e.rows),r.uniform1i(this.uniforms.cols,e.cols),r.bindBuffer(r.ARRAY_BUFFER,this.vbo),r.bufferData(r.ARRAY_BUFFER,e.data,r.DYNAMIC_DRAW),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.canvas.bitmap_font),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,t),this.use_user_font)r.uniform1i(this.uniforms.use_user_font,1);if(this.canvas.user_font!==null)r.activeTexture(r.TEXTURE2),r.bindTexture(r.TEXTURE_2D,this.canvas.user_font);else if(this.use_user_font)this.use_user_font=!1,r.uniform1i(this.uniforms.use_user_font,0);r.bindVertexArray(this.vao),r.drawArraysInstanced(r.TRIANGLES,0,6,e.rows*e.cols),r.bindVertexArray(null)}}class w{static create(){let e=new Float32Array(16);return e[0]=1,e[5]=1,e[10]=1,e[15]=1,e}static set(e,t,n,r,o,s,i,x,c,a,l,u,h,d,m,p,_){return e[0]=t,e[1]=n,e[2]=r,e[3]=o,e[4]=s,e[5]=i,e[6]=x,e[7]=c,e[8]=a,e[9]=l,e[10]=u,e[11]=h,e[12]=d,e[13]=m,e[14]=p,e[15]=_,e}static multiply(e,t,n){let r=t[0],o=t[1],s=t[2],i=t[3],x=t[4],c=t[5],a=t[6],l=t[7],u=t[8],h=t[9],d=t[10],m=t[11],p=t[12],_=t[13],v=t[14],E=t[15],g=n[0],b=n[1],y=n[2],T=n[3];return e[0]=g*r+b*x+y*u+T*p,e[1]=g*o+b*c+y*h+T*_,e[2]=g*s+b*a+y*d+T*v,e[3]=g*i+b*l+y*m+T*E,g=n[4],b=n[5],y=n[6],T=n[7],e[4]=g*r+b*x+y*u+T*p,e[5]=g*o+b*c+y*h+T*_,e[6]=g*s+b*a+y*d+T*v,e[7]=g*i+b*l+y*m+T*E,g=n[8],b=n[9],y=n[10],T=n[11],e[8]=g*r+b*x+y*u+T*p,e[9]=g*o+b*c+y*h+T*_,e[10]=g*s+b*a+y*d+T*v,e[11]=g*i+b*l+y*m+T*E,g=n[12],b=n[13],y=n[14],T=n[15],e[12]=g*r+b*x+y*u+T*p,e[13]=g*o+b*c+y*h+T*_,e[14]=g*s+b*a+y*d+T*v,e[15]=g*i+b*l+y*m+T*E,e}static transpose(e,t){if(e===t){let n=t[1],r=t[2],o=t[3],s=t[6],i=t[7],x=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=n,e[6]=t[9],e[7]=t[13],e[8]=r,e[9]=s,e[11]=t[14],e[12]=o,e[13]=i,e[14]=x}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15];return e}static inverse(e,t){let n=t[0],r=t[1],o=t[2],s=t[3],i=t[4],x=t[5],c=t[6],a=t[7],l=t[8],u=t[9],h=t[10],d=t[11],m=t[12],p=t[13],_=t[14],v=t[15],E=n*x-r*i,g=n*c-o*i,b=n*a-s*i,y=r*c-o*x,T=r*a-s*x,F=o*a-s*c,N=l*p-u*m,D=l*_-h*m,O=l*v-d*m,z=u*_-h*p,G=u*v-d*p,U=h*v-d*_,R=1/(E*U-g*G+b*z+y*O-T*D+F*N);return e[0]=(x*U-c*G+a*z)*R,e[1]=(o*G-r*U-s*z)*R,e[2]=(p*F-_*T+v*y)*R,e[3]=(h*T-u*F-d*y)*R,e[4]=(c*O-i*U-a*D)*R,e[5]=(n*U-o*O+s*D)*R,e[6]=(_*b-m*F-v*g)*R,e[7]=(l*F-h*b+d*g)*R,e[8]=(i*G-x*O+a*N)*R,e[9]=(r*O-n*G-s*N)*R,e[10]=(m*T-p*b+v*E)*R,e[11]=(u*b-l*T-d*E)*R,e[12]=(x*D-i*z-c*N)*R,e[13]=(n*z-r*D+o*N)*R,e[14]=(p*g-m*y-_*E)*R,e[15]=(l*y-u*g+h*E)*R,e}static inverseTranspose3x3(e,t){let n=t[0],r=t[1],o=t[2],s=t[3],i=t[4],x=t[5],c=t[6],a=t[7],l=t[8],u=t[9],h=t[10],d=t[11],m=t[12],p=t[13],_=t[14],v=t[15],E=n*x-r*i,g=n*c-o*i,b=n*a-s*i,y=r*c-o*x,T=r*a-s*x,F=o*a-s*c,N=l*p-u*m,D=l*_-h*m,O=l*v-d*m,z=u*_-h*p,G=u*v-d*p,U=h*v-d*_,R=1/(E*U-g*G+b*z+y*O-T*D+F*N);return e[0]=(x*U-c*G+a*z)*R,e[1]=(c*O-i*U-a*D)*R,e[2]=(i*G-x*O+a*N)*R,e[3]=(o*G-r*U-s*z)*R,e[4]=(n*U-o*O+s*D)*R,e[5]=(r*O-n*G-s*N)*R,e[6]=(p*F-_*T+v*y)*R,e[7]=(_*b-m*F-v*g)*R,e[8]=(m*T-p*b+v*E)*R,e}static perspective(e,t,n,r,o){let s=1/Math.tan(t/2);e[0]=s/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=s,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0;let i=1/(r-o);return e[10]=(o+r)*i,e[14]=2*o*r*i,e}static orthographic(e,t,n,r,o,s,i){return e[0]=2/(n-t),e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=2/(o-r),e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=-2/(i-s),e[11]=0,e[12]=-(n+t)/(n-t),e[13]=-(o+r)/(o-r),e[14]=-(i+s)/(i-s),e[15]=1,e}static lookAt(e,t,n,r){let o,s,i,x,c,a,l,u,h,d;return l=t[0]-n[0],u=t[1]-n[1],h=t[2]-n[2],d=1/Math.hypot(l,u,h),l*=d,u*=d,h*=d,o=r[1]*h-r[2]*u,s=r[2]*l-r[0]*h,i=r[0]*u-r[1]*l,d=1/Math.hypot(o,s,i),o*=d,s*=d,i*=d,x=u*i-h*s,c=h*o-l*i,a=l*s-u*o,d=1/Math.hypot(x,c,a),x*=d,c*=d,a*=d,e[0]=o,e[1]=x,e[2]=l,e[3]=0,e[4]=s,e[5]=c,e[6]=u,e[7]=0,e[8]=i,e[9]=a,e[10]=h,e[11]=0,e[12]=-(o*t[0]+s*t[1]+i*t[2]),e[13]=-(x*t[0]+c*t[1]+a*t[2]),e[14]=-(l*t[0]+u*t[1]+h*t[2]),e[15]=1,e}static translation(e,t,n){let r=w.create();return w.set(r,1,0,0,0,0,1,0,0,0,0,1,0,e,t,n,1),r}static scale(e,t,n){let r=w.create();return w.set(r,e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),r}static rotation(e,t){let n=Math.cos(t),r=Math.sin(t),o=w.create();switch(e){case"x":w.set(o,1,0,0,0,0,n,r,0,0,-r,n,0,0,0,0,1);break;case"y":w.set(o,n,0,-r,0,0,1,0,0,r,0,n,0,0,0,0,1);break;case"z":w.set(o,n,r,0,0,-r,n,0,0,0,0,1,0,0,0,0,1);break}return o}}function B(e,t){return new Promise((n,r)=>{let o=new Image;o.src=t,o.onload=()=>{let s=e.createTexture();if(!s){r(Error("When creating GL texture"));return}e.bindTexture(e.TEXTURE_2D,s),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!0),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,o),e.generateMipmap(e.TEXTURE_2D),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR_MIPMAP_LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),n(s)}})}function R0(e,t){let n=t*3,r=e.palette;return[r[n],r[n+1],r[n+2]]}var K=new oe([[20,20,21],[216,100,126],[127,165,99],[243,190,124],[110,148,178],[187,157,189],[174,174,209],[205,205,205],[96,96,121],[224,131,152],[153,183,130],[245,203,150],[139,169,193],[201,177,202],[190,190,218],[247,247,247]]);class f{line;col;constructor(e,t){this.line=e,this.col=t}before(e){return this.line<e.line||this.line===e.line&&this.col<e.col}after(e){return e.before(this)}equals(e){return this.line===e.line&&this.col===e.col}withLine(e){return new f(e,this.col)}withCol(e){return new f(this.line,e)}advancedBy(e){let t=e.split(`
`);if(t.length===1)return new f(this.line,this.col+e.length);return new f(this.line+t.length-1,t[t.length-1].length)}}class A{start;end;linewise;constructor(e,t,n){this.start=e,this.end=t,this.linewise=n}normalized(){if(this.start.before(this.end)||this.start.equals(this.end))return new A(this.start,this.end,this.linewise);return new A(this.end,this.start,this.linewise)}}function gt(e){return e===void 0||e===" "||e==="\t"}class Ne{lines;modified=!1;constructor(e){if(this.lines=e.split(`
`),this.lines.length===0)this.lines=[""]}lineCount(){return this.lines.length}lineText(e){return this.lines[e]??""}lineLength(e){return this.lineText(e).length}charAt(e){return this.lineText(e.line)[e.col]}isBlankAt(e){return gt(this.charAt(e))}lastCol(e){return new f(e,Math.max(0,this.lineLength(e)-1))}endOfLine(e){return new f(e,this.lineLength(e))}firstNonBlank(e){let t=this.lineText(e).search(/\S/);return new f(e,t===-1?0:t)}isEmptyLine(e){return this.lineLength(e)===0}textOf(e){let{start:t,end:n,linewise:r}=e.normalized();if(r)return this.lines.slice(t.line,n.line+1).join(`
`)+`
`;if(t.line===n.line)return this.lineText(t.line).slice(t.col,n.col);let o=this.lineText(t.line).slice(t.col),s=this.lines.slice(t.line+1,n.line),i=this.lineText(n.line).slice(0,n.col);return[o,...s,i].join(`
`)}insert(e,t){let[n,...r]=t.split(`
`),o=this.lineText(e.line),s=o.slice(e.col);this.lines[e.line]=o.slice(0,e.col)+n+(r.length>0?"":s);for(let[i,x]of r.entries()){let c=i===r.length-1;this.lines.splice(e.line+1+i,0,x+(c?s:""))}this.modified=!0}remove(e){let{start:t,end:n,linewise:r}=e.normalized();if(r){if(this.lines.splice(t.line,n.line-t.line+1),this.lines.length===0)this.lines=[""]}else if(t.line===n.line){let o=this.lineText(t.line);this.lines[t.line]=o.slice(0,t.col)+o.slice(n.col)}else{let o=this.lineText(t.line).slice(0,t.col),s=this.lineText(n.line).slice(n.col);this.lines.splice(t.line,n.line-t.line+1,o+s)}this.modified=!0}replace(e,t){let n=e.normalized().start;this.remove(e),this.insert(n,t)}splitLine(e){let t=this.lineText(e.line);this.lines.splice(e.line,1,t.slice(0,e.col),t.slice(e.col)),this.modified=!0}joinLine(e){if(e>=this.lineCount()-1)return;let t=this.lineText(e),n=this.lineText(e+1).trimStart(),r=t.length>0&&!t.endsWith(" ")?" ":"";this.lines.splice(e,2,t+r+n),this.modified=!0}}class De{pos;sticky;constructor(){this.pos=new f(0,0),this.sticky=null}setExact(e){this.pos=e,this.sticky=null}}var bt={rows:40,cols:80},vt=/^\d+$/;function M0(e,t){let n=e.trim();if(!vt.test(n))return 0;return Math.min(Number(n),t)}function yt(e,t){let[n="",r="",o=""]=e.split("|");if(n==="")return null;let s={name:n,rows:M0(r,t.rows),cols:M0(o,t.cols)};if(s.rows===0||s.cols===0)return null;return s}class Oe{buffer;wrap_width;image_limits;lines=[];display_rows_cache=null;raw_line=null;constructor(e,t,n=bt){this.buffer=e;this.wrap_width=t;this.image_limits=n}get wrapWidth(){return this.wrap_width}setWidth(e){if(e===this.wrap_width)return;this.wrap_width=e,this.lines.length=0,this.display_rows_cache=null}invalidate(e){this.lines[e]=void 0,this.display_rows_cache=null}setRawLine(e){if(e===this.raw_line)return;let t=this.raw_line;if(this.raw_line=e,t!==null)this.invalidate(t);if(e!==null)this.invalidate(e)}invalidateFrom(e){this.lines.length=Math.min(this.lines.length,e),this.display_rows_cache=null}grid(e){return this.compile(e)}lineRowCount(e){return this.compile(e).rows}get displayRows(){if(this.display_rows_cache!==null)return this.display_rows_cache;let e=[];for(let t=0;t<this.buffer.lineCount();t++)for(let n=0;n<this.compile(t).rows;n++)e.push({line:t,row_in_line:n});return this.display_rows_cache=e,e}get firstRowOfLine(){let e=[];for(let[t,n]of this.displayRows.entries())if(n.row_in_line===0)e[n.line]=t;return e}bufferToScreen(e){return this.compile(e.line).cursorCell(e.col)}bufferAtVisibleCol(e,t,n){return new f(e,this.compile(e).cursorIndex(t,n))}screenToBuffer(e,t){let n=this.displayRows[e];if(n===void 0)return null;return this.bufferAtVisibleCol(n.line,n.row_in_line,t)}rawRowCount(e){let t=this.buffer.lineText(e);if(!ve(t))return null;return Se(t,this.wrap_width,{wrap:C.HARD,raw:!0}).length}links(){let e=[];for(let t=0;t<this.buffer.lineCount();t++)for(let n of this.compile(t).anchors[0]??[]){if(n.options===null)continue;e.push({line:t,row_in_line:n.row,col:n.col,index:n.index,options:n.options})}return e}images(){let e=[];for(let t=0;t<this.buffer.lineCount();t++)for(let n of this.compile(t).anchors[2]??[]){let r=yt(n.options??"",this.image_limits);if(r===null)continue;e.push({line:t,row_in_line:n.row,col:n.col,...r})}return e}compile(e){let t=this.lines[e];if(t!==void 0)return t;let n=this.buffer.lineText(e),r=new I(n,this.wrap_width,{wrap:C.HARD,raw:e===this.raw_line&&ve(n)});return this.lines[e]=r,r}}var Et=new Set(["d","c","y","<",">"]),A0=new Set(["f","F","t","T"]),Tt=new Set(["x","X","D","C","s","S","~","J","p","P","u","U",".","R","i","I","a","A","o","O"]),Rt=new Set(["<c-f>","<c-b>","<c-d>","<c-u>"]),Mt=new Set(["h","l","w","W","b","B","e","E","%","(",")","{","}","G","+","-","|","^","$","0","j","k","n","N","enter",";",","]),At={"<up>":"k","<down>":"j","<left>":"h","<right>":"l","<bs>":"h"};function Lt(){return{count1:null,count2:null,operator:null,register:null,register_pending:!1,g_pending:!1,char_command:null,mark_mode:null}}function kt(e){if(e==="gu")return"u";if(e==="gU")return"U";if(e==="g~")return"~";return e}function Ct(e,t){return Math.min(1e6,(e??0)*10+Number(t))}function ye(e,t,n,r){return{name:e,char:r,count:n??t??0}}function Pt(e,t){if(e.name==="G")return e.count!==0?e.count:t??0;return e.count===0?t??1:e.count*(t??1)}function he(e,t,n){return{kind:"operator",operator:e.operator??"d",motion:t===null?null:{...t,count:Pt(t,e.count1)},linewise:n,count:e.count1??1,register:e.register??void 0}}function Ge(e){return e.operator===null?e.count1:e.count2}function L0(e,t){let n=e??Lt();if(t==="esc")return{pending:null,command:null};if(n.char_command!==null){let o=n.char_command;if((o==="m"||o==="r")&&n.operator!==null)return{pending:null,command:{kind:"invalid"}};if(o==="m")return/^[a-z]$/.test(t)?{pending:null,command:{kind:"simple",key:"m",count:n.count1??1,char:t}}:{pending:null,command:{kind:"invalid"}};if(A0.has(o)){let s=ye(o,null,Ge(n),t);return n.operator===null?{pending:null,command:{kind:"motion",motion:s}}:{pending:null,command:he(n,s,!1)}}return{pending:null,command:{kind:"simple",key:"r",count:n.count1??1,char:t,register:n.register??void 0}}}if(n.mark_mode!==null){let o=n.mark_mode;if(!/^[a-z'`]$/.test(t))return{pending:null,command:{kind:"invalid"}};let s=t==="'"||t==="`",i=o==="'"&&!s?"mark_line":"mark_exact",x=s?void 0:t,c=ye(i,null,Ge(n),x);return n.operator===null?{pending:null,command:{kind:"motion",motion:c}}:{pending:null,command:he(n,c,!1)}}if(n.register_pending){if(!/^[a-z0-9]$/.test(t))return{pending:null,command:{kind:"invalid"}};return{pending:{...n,register:t,register_pending:!1},command:null}}if(/^[1-9]$/.test(t)||t==="0"&&(n.count1!==null||n.count2!==null)){let o=n.operator===null?"count1":"count2";return{pending:{...n,[o]:Ct(n[o],t)},command:null}}if(n.g_pending){if(t==="e"||t==="E"){let o=ye(`g${t}`,null,Ge(n));return n.operator===null?{pending:null,command:{kind:"motion",motion:o}}:{pending:null,command:he(n,o,!1)}}if((t==="u"||t==="U"||t==="~")&&n.operator===null)return{pending:{...n,g_pending:!1,operator:t==="u"?"gu":t==="U"?"gU":"g~"},command:null};return{pending:null,command:{kind:"invalid"}}}if(n.operator!==null&&t===kt(n.operator))return{pending:null,command:he(n,null,!0)};if(n.operator===null&&Et.has(t))return{pending:{...n,operator:t},command:null};if(n.operator===null&&t==="g")return{pending:{...n,g_pending:!0},command:null};let r=At[t];if(Mt.has(t)||r!==void 0){let o=r??t,s=n.operator===null?n.count1:null,i=ye(o,s,n.count2);return n.operator===null?{pending:null,command:{kind:"motion",motion:i}}:{pending:null,command:he(n,i,!1)}}if(A0.has(t)||t==="m"||t==="r")return{pending:{...n,char_command:t},command:null};if(t==="'"||t==="`")return{pending:{...n,mark_mode:t},command:null};if(t==='"')return{pending:{...n,register_pending:!0},command:null};if(Tt.has(t)||Rt.has(t))return{pending:null,command:{kind:"simple",key:t,count:n.count1??1,register:n.register??void 0}};if(t===":"||t==="/"||t==="?")return{pending:null,command:{kind:"command_line",prompt:t}};return{pending:null,command:{kind:"invalid"}}}class Ue{zero=null;numbered=[];named=new Map;unnamed=null;record(e,t){if(this.unnamed=e,t!==void 0){this.recordNamed(e,t);return}if(e.linewise)this.numbered.unshift(e),this.numbered.length=Math.min(this.numbered.length,9)}recordYank(e,t){if(this.unnamed=e,t!==void 0){this.recordNamed(e,t);return}this.zero=e}read(e){if(e===void 0)return this.unnamed;if(e==="0")return this.zero;if(/^[1-9]$/.test(e))return this.numbered[Number(e)-1]??null;return this.named.get(e.toLowerCase())??null}recordNamed(e,t){let n=t.toLowerCase(),r=this.named.get(n);if(t===t.toUpperCase()&&r!==void 0){let o=e.linewise||r.linewise?`
`:"";this.named.set(n,{text:r.text+o+e.text,linewise:e.linewise});return}this.named.set(n,e)}}class We{state=null;line_state=null;remember(e){this.state=e}touchLine(e,t){if(this.line_state===null||this.line_state.line!==e)this.line_state={line:e,snapshot:t}}take(e){let t=this.state;return this.state=e,this.line_state=null,t}takeLine(){let e=this.line_state?.snapshot??null;return this.line_state=null,e}}var He={w:"Saved. (To where? There's no disk. Trust me.)",q:"Nowhere to go. You're here forever.",wq:"Saved and quit. Wait-- you can't quit. You're still here."};function St(e,t){let n=[],r="";for(let o=0;o<e.length;o++){let s=e[o];if(s==="\\"&&e[o+1]===t){r+=t,o++;continue}if(s===t){n.push(r),r="";continue}r+=s}return n.push(r),n}function Bt(e,t){let n=e.buffer,r=e.cursor.pos,o;if(t==="$")o=n.lineCount()-1;else if(t.startsWith("+")||t.startsWith("-")){let i=t==="+"||t==="-"?1:Number(t);o=r.line+i}else o=Number(t)-1;let s=Math.max(0,Math.min(n.lineCount()-1,o));e.last_jump=r,e.placeCursor(n.firstNonBlank(s))}function It(e){return Number(e.trim()||"1")||1}function k0(e,t){let n=e.cursor.pos.line,r=Math.min(e.buffer.lineCount()-1,n+It(t)-1);return new A(new f(n,0),new f(r,0),!0)}function Ft(e,t){e.deleteRange(k0(e,t))}function Nt(e,t){e.yankRange(k0(e,t))}function Dt(e,t,n){if(!t.startsWith("/")){e.flash("E486: Pattern not found");return}let[r="",o="",s=""]=St(t.slice(1),"/"),i=s.includes("g"),x=r===""?e.search.pattern:r;if(x===""){e.flash("E35: No previous regular expression");return}let c=e.buffer,a=n?0:e.cursor.pos.line,l=n?c.lineCount()-1:e.cursor.pos.line,u=[];for(let h=a;h<=l;h++){let d=c.lineText(h),m=d;if(i)m=d.split(x).join(o);else{let p=d.indexOf(x);if(p!==-1)m=d.slice(0,p)+o+d.slice(p+x.length)}if(m!==d)u.push([h,m])}if(u.length===0){e.flash("E486: Pattern not found: "+x);return}e.rememberState();for(let[h,d]of u)c.lines[h]=d;c.modified=!0,e.afterEdit(a),e.flash(`${u.length} substitution${u.length===1?"":"s"}`)}function C0(e,t){let n=t.trim();if(n==="")return;if(/^\d+$/.test(n)||n==="$"||/^[+-]\d*$/.test(n)){Bt(e,n);return}if(/^(%?)s\//.test(n)){Dt(e,n.slice(n[0]==="%"?2:1),n[0]==="%");return}let[r,...o]=n.split(/\s+/);switch(r){case"w":e.buffer.modified=!1,e.flash(He.w);return;case"q":case"q!":e.flash(He.q);return;case"wq":e.buffer.modified=!1,e.flash(He.wq);return;case"d":Ft(e,o.join(" "));return;case"y":Nt(e,o.join(" "));return;case"pu":case"put":e.putRange();return}e.flash("E492: Not an editor command: "+n)}var fe="E486: Pattern not found: ";function Ee(e,t,n,r){if(n==="")return null;let o=e.lineCount(),s=r?1:-1;for(let i=1;i<=o;i++){let x=((t.line+s*i)%o+o)%o,c=e.lineText(x),a=x===t.line?r?c.indexOf(n,t.col+1):t.col===0?-1:c.lastIndexOf(n,t.col-1):r?c.indexOf(n):c.lastIndexOf(n);if(a!==-1)return new f(x,a)}return null}function P0(e,t){let n=e.command_line;if(n===null){e.mode="normal";return}let r=()=>{e.command_line=null,e.mode="normal"};if(t==="esc"){r();return}if(t==="enter"){let{text:o,prompt:s}=n;if(r(),o.trim()!=="")e.history.push(o);if(s===":"){C0(e,o);return}Gt(e,o,s==="/");return}if(t==="<bs>"){if(n.text===""){r();return}n.text=n.text.slice(0,-1);return}if(t==="<up>"||t==="<down>"){Ot(e,t==="<up>"?-1:1);return}if(t.length===1)n.text+=t}function Ot(e,t){if(e.history.length===0||e.command_line===null)return;let r=(e.history_index??e.history.length)+t;if(r>=e.history.length){e.history_index=null,e.command_line.text="";return}e.history_index=Math.max(0,r),e.command_line.text=e.history[e.history_index]??""}function Gt(e,t,n){let r=t===""?e.search.pattern:t;if(r==="")return;e.search={pattern:r,forward:n};let o=Ee(e.buffer,e.cursor.pos,r,n);if(o===null){e.flash(fe+r);return}let s=e.cursor.pos.line,i=n?o.line<s:o.line>s;if(e.last_jump=e.cursor.pos,e.cursor.setExact(o),i){let x=n?"BOTTOM":"TOP",c=n?"TOP":"BOTTOM";e.flash(`search hit ${x}, continuing at ${c}`)}}function Ut(e,t,n){if(t<=1||e.length===0)return"";let r=n==="open_below"||n==="open_above"?`
`:"";return r+Array(t-1).fill(e).join(r)}function W(e,t,n,r){e.rememberState();let o=e.cursor.pos,s;switch(t){case"append":s=new f(o.line,Math.min(e.buffer.lineLength(o.line),o.col+1));break;case"line_start":s=new f(o.line,0);break;case"append_eol":s=new f(o.line,e.buffer.lineLength(o.line));break;case"open_below":e.buffer.splitLine(e.buffer.endOfLine(o.line)),s=new f(o.line+1,0);break;case"open_above":e.buffer.splitLine(new f(o.line,0)),s=new f(o.line,0);break;default:s=o}e.session={location:t,count:n,start:s,replace:r,change_base:null},e.mode=r?"replace":"insert",e.cursor.setExact(s),e.afterEdit(o.line)}function Xe(e,t){if(e.session===null){e.mode="normal";return}if(t==="esc"){ce(e);return}if(t==="enter"){let o=e.cursor.pos;e.buffer.splitLine(o),e.cursor.setExact(new f(o.line+1,0)),e.afterEdit(o.line);return}if(t==="<bs>"){Wt(e);return}if(t==="<up>"||t==="<down>"||t==="<left>"||t==="<right>"){Ht(e,t);return}if(t.length!==1)return;let n=e.cursor.pos,r=e.buffer.lineText(n.line);if(e.mode==="replace"&&n.col<r.length)e.buffer.lines[n.line]=r.slice(0,n.col)+t+r.slice(n.col+1),e.buffer.modified=!0;else e.buffer.insert(n,t);e.cursor.setExact(new f(n.line,n.col+1)),e.afterEdit(n.line)}function Wt(e){let t=e.cursor.pos;if(t.col>0)e.buffer.remove(new A(new f(t.line,t.col-1),new f(t.line,t.col),!1)),e.cursor.setExact(new f(t.line,t.col-1));else if(t.line>0){let n=e.buffer.lineLength(t.line-1);e.buffer.lines[t.line-1]+=e.buffer.lineText(t.line),e.buffer.lines.splice(t.line,1),e.buffer.modified=!0,e.cursor.setExact(new f(t.line-1,n))}e.afterEdit(e.cursor.pos.line)}function Ht(e,t){let n=e.cursor.pos;if(t==="<up>"&&n.line>0){let r=Math.min(n.col,e.buffer.lineLength(n.line-1));e.cursor.setExact(new f(n.line-1,r));return}if(t==="<down>"&&n.line<e.buffer.lineCount()-1){let r=Math.min(n.col,e.buffer.lineLength(n.line+1));e.cursor.setExact(new f(n.line+1,r));return}if(t==="<left>"&&n.col>0){e.cursor.setExact(new f(n.line,n.col-1));return}if(t==="<right>"&&n.col<e.buffer.lineLength(n.line))e.cursor.setExact(new f(n.line,n.col+1))}function ce(e){let t=e.session;if(t===null){e.mode="normal";return}let n=e.cursor.pos,o=n.before(t.start)?"":e.buffer.textOf(new A(t.start,n,!1)),s=Ut(o,t.count,t.location),i=n;if(s.length>0)e.buffer.insert(n,s),i=n.advancedBy(s);e.mode="normal",e.session=null,e.afterEdit(n.line);let x=o.length>0?i.withCol(Math.max(0,i.col-1)):n;if(e.cursor.setExact(x),e.clampCursor(),t.replace){e.repeat_last={kind:"replace_text",count:t.count,text:o};return}if(t.change_base!==null){let{sugar:c,...a}=t.change_base,l=c===void 0?{kind:"change",...a,text:o}:{kind:"sugar_change",key:c,count:a.count,register:a.register,text:o};e.repeat_last=l;return}e.repeat_last={kind:"insert",location:t.location,count:t.count,text:o}}function de(e,t){for(let n of t)Xe(e,n===`
`?"enter":n)}function S0(e,t,n,r){W(e,t,n,!1),de(e,r),ce(e)}function H(e,t){if(t.col>0)return new f(t.line,t.col-1);if(t.line>0)return e.lastCol(t.line-1);return null}function X(e,t){if(t.col<e.lineLength(t.line)-1)return new f(t.line,t.col+1);if(t.line<e.lineCount()-1)return new f(t.line+1,0);return null}function q(e,t){return t.col===0&&e.isEmptyLine(t.line)}var Te={"(":")","[":"]","{":"}"},Ve={")":"(","]":"[","}":"}"};function Xt(e,t){let n=e.charAt(t),o=n!==void 0&&(Te[n]!==void 0||Ve[n]!==void 0)?t:null;if(o===null){let l=e.lineText(t.line);for(let u=t.col;u<l.length;u++){let h=l[u];if(h!==void 0&&(Te[h]!==void 0||Ve[h]!==void 0)){o=new f(t.line,u);break}}}if(o===null)return null;let s=e.charAt(o);if(s===void 0)return null;let i=Te[s]!==void 0,x=i?Te[s]:Ve[s],c=0,a=o;while((a=i?X(e,a):H(e,a))!==null){let l=e.charAt(a);if(l===x&&c===0)return a;if(l===s)c++;else if(l===x)c--}return null}var B0=(e,t,n)=>{let r=Xt(n.buffer,t);return r===null?null:{to:r,kind:"inclusive"}};function Vt(e,t,n,r,o,s){let i=e.lineText(t.line),x=t.col;for(let c=0;c<s;c++){let a=-1;if(n!==void 0)a=r?i.indexOf(n,x+1):x>0?i.lastIndexOf(n,x-1):-1;if(a===-1)return null;x=a}if(o)return new f(t.line,Math.max(0,r?x-1:x+1));return new f(t.line,x)}var te=(e,t,n)=>{let r=["f","F","t","T"],o,s,i;if(r.includes(e.name))o=e.char,s=e.name==="f"||e.name==="t",i=e.name==="t"||e.name==="T";else{let a=n.last_char_search;if(a===null)return null;o=a.char,s=e.name===";"===a.forward,i=a.before_target}let x=Math.max(1,e.count),c=Vt(n.buffer,t,o,s,i,x);return c===null?null:{to:c,kind:"inclusive"}};var V=(e,t,n)=>{let r=n.buffer,o=Math.max(1,e.count);switch(e.name){case"h":return{to:new f(t.line,Math.max(0,t.col-o)),kind:"exclusive"};case"l":{let s=Math.min(r.lastCol(t.line).col,t.col+o);return{to:new f(t.line,s),kind:"exclusive"}}case"0":return{to:new f(t.line,0),kind:"exclusive"};case"^":return{to:r.firstNonBlank(t.line),kind:"exclusive"};case"$":{let s=Math.min(r.lineCount()-1,t.line+o-1);return{to:r.lastCol(s),kind:"inclusive"}}case"|":return{to:new f(t.line,Math.max(0,o-1)),kind:"exclusive"};case"G":{let s=r.lineCount()-1,i=e.count===0?s:Math.min(s,o-1);return{to:new f(i,0),kind:"linewise"}}case"+":case"enter":return{to:new f(Math.min(r.lineCount()-1,t.line+o),0),kind:"linewise"};case"-":return{to:new f(Math.max(0,t.line-o),0),kind:"linewise"}}return null};var ze=(e,t,n)=>{let r=e.char===void 0?n.last_jump:n.marks.get(e.char);if(r===void 0||r===null)return null;if(e.name==="mark_line")return{to:new f(r.line,0),kind:"linewise"};return{to:r,kind:"exclusive"}},je=(e,t,n)=>{let r=e.name==="n"===n.search.forward,o=Ee(n.buffer,t,n.search.pattern,r);return o===null?null:{to:o,kind:"exclusive"}};function zt(e,t){if(e.isEmptyLine(t.line)){for(let n=t.line+1;n<e.lineCount();n++)if(!e.isEmptyLine(n))return new f(n,0);return null}for(let n=t.line+1;n<e.lineCount();n++)if(e.isEmptyLine(n))return new f(n,0);return null}function jt(e,t){if(e.isEmptyLine(t.line)){for(let n=t.line-1;n>=0;n--)if(!e.isEmptyLine(n))return new f(n,0);return new f(0,0)}for(let n=t.line-1;n>=0;n--)if(e.isEmptyLine(n))return new f(n+1,0);return new f(0,0)}var $e=(e,t,n)=>{let r=n.buffer,s=e.name==="}"?zt(r,t):jt(r,t);return s===null?null:{to:s,kind:"exclusive"}};function $t(e,t){let n=e.layout.displayRows[e.viewport_top+t];if(n===void 0)return null;return e.layout.bufferAtVisibleCol(n.line,n.row_in_line,0)}function Yt(e,t){let n=e.name==="H"?Math.max(1,e.count)-1:e.name==="M"?Math.floor((t.screen_rows-1)/2):Math.max(0,t.screen_rows-Math.max(1,e.count)),r=$t(t,n);return r===null?null:{to:r,kind:"linewise"}}function Kt(e,t,n){let r=n.layout.displayRows,o=n.layout.bufferToScreen(t),i=(n.layout.firstRowOfLine[t.line]??0)+o.row,x=e.name==="j"?Math.max(1,e.count):-Math.max(1,e.count),c=Math.max(0,Math.min(r.length-1,i+x)),a=r[c];if(a===void 0)return null;return{to:new f(a.line,0),kind:"linewise"}}var ae=(e,t,n)=>{if(e.name==="j"||e.name==="k")return Kt(e,t,n);return Yt(e,n)};function qt(e,t){let n=t,r=!1;while((n=X(e,n))!==null){let o=e.charAt(n);if(q(e,n)&&!r)return n;if(r){if(o!==void 0&&".!?".includes(o))continue;if(o!==void 0&&(o===" "||o==="\t"))continue;return n}if(o!==void 0&&".!?".includes(o))r=!0}return null}function Jt(e,t){let n=t,r=null,o=!1;while((n=H(e,n))!==null){let s=e.charAt(n);if(q(e,n)&&r!==null)return r;if(q(e,n)){o=!0;continue}if(s!==void 0&&".!?".includes(s)){let i=X(e,n);if(i!==null&&(i.line!==n.line||e.isBlankAt(i))){if(r=i,o)return r}}else o=!1}return r}var Ye=(e,t,n)=>{let r=n.buffer,s=e.name===")"?qt(r,t):Jt(r,t);return s===null?null:{to:s,kind:"exclusive"}};function ne(e,t){if(e===void 0||e===" "||e==="\t")return"blank";if(t)return"non-blank";return/[A-Za-z0-9_]/.test(e)?"word":"punct"}function Ke(e,t,n,r,o){return e.line===t.line&&ne(n.charAt(e),r)===o}function Zt(e,t,n){let r=t;if(q(e,r)&&r.line<e.lineCount()-1)return new f(r.line+1,0);let o=e.charAt(r);if(o!==void 0&&ne(o,n)!=="blank"){let s=ne(o,n);while(!0){let i=X(e,r);if(i===null||!Ke(i,r,e,n,s))break;r=i}}while(!0){let s=X(e,r);if(s===null)return null;if(r=s,q(e,r)||!e.isBlankAt(r))return r}}function Qt(e,t,n){let r=H(e,t);if(r===null)return null;while(e.isBlankAt(r)&&!q(e,r)){let s=H(e,r);if(s===null)return r;r=s}let o=ne(e.charAt(r),n);while(!0){let s=H(e,r);if(s===null||!Ke(s,r,e,n,o))return r;r=s}}function en(e,t,n){let r=X(e,t);if(r===null)return null;while(e.charAt(r)===void 0||e.isBlankAt(r)){let s=X(e,r);if(s===null)return null;r=s}let o=ne(e.charAt(r),n);while(!0){let s=X(e,r);if(s===null||!Ke(s,r,e,n,o))return r;r=s}}function tn(e,t,n){let r=H(e,t);if(r===null)return null;let o=ne(e.charAt(t),n);if(o!=="blank")while(r.line===t.line&&ne(e.charAt(r),n)===o){let s=H(e,r);if(s===null)return null;r=s}while(e.isBlankAt(r)){let s=H(e,r);if(s===null)return null;r=s}return r}var j=(e,t,n)=>{let r=["W","B","E","gE"].includes(e.name),o=n.buffer,s=t;for(let i=0;i<Math.max(1,e.count)&&s!==null;i++)if(e.name==="w"||e.name==="W")s=Zt(o,s,r);else if(e.name==="b"||e.name==="B")s=Qt(o,s,r);else if(e.name==="ge"||e.name==="gE")s=tn(o,s,r);else s=en(o,s,r);if(s===null)return null;return e.name==="w"||e.name==="W"||e.name==="b"||e.name==="B"?{to:s,kind:"exclusive"}:{to:s,kind:"inclusive"}};var nn=new Set(["G","%","(",")","{","}","H","M","L","n","N","mark_exact","mark_line"]);function qe(e){return nn.has(e)}var rn={h:V,l:V,"0":V,"^":V,$:V,"|":V,G:V,"+":V,"-":V,enter:V,j:ae,k:ae,H:ae,M:ae,L:ae,w:j,W:j,b:j,B:j,e:j,E:j,ge:j,gE:j,f:te,F:te,t:te,T:te,";":te,",":te,"%":B0,"(":Ye,")":Ye,"{":$e,"}":$e,mark_exact:ze,mark_line:ze,n:je,N:je};function Je(e,t,n){let r=rn[e.name];if(r===void 0)return null;return r(e,t,n)}var on="\t";function sn(e){let t=0,n=0;while(n<e.length&&(e[n]===" "||e[n]==="\t"))t+=e[n]==="\t"?L-t%L:1,n++;if(n===0)return e;let r=Math.floor((t-1)/L)*L;return"\t".repeat(r/L)+e.slice(n)}function xn(e,t){if(t==="lower")return e.toLowerCase();if(t==="upper")return e.toUpperCase();return e===e.toLowerCase()?e.toUpperCase():e.toLowerCase()}function cn(e,t,n){let r=t.normalized();for(let s=r.start.line;s<=r.end.line;s++){let i=e.lineText(s),x=s===r.start.line?r.start.col:0,c=s===r.end.line&&!r.linewise?r.end.col:i.length,a="";for(let[l,u]of[...i].entries())a+=l>=x&&l<c?xn(u,n):u;e.lines[s]=a}e.modified=!0;let o=Math.max(0,e.lineLength(r.start.line)-1);return r.start.withCol(Math.min(r.start.col,o))}function an(e,t,n){let r=t.normalized();if(r.linewise||r.end.line<=r.start.line||r.end.col!==0)return r;let o=new f(r.end.line-1,e.lineLength(r.end.line-1));if(n==="exclusive"&&r.start.col<=e.firstNonBlank(r.start.line).col)return new A(r.start,new f(r.end.line-1,0),!0);return new A(r.start,o,!1)}function I0(e,t,n,r){if(r)return e.firstNonBlank(n).col;let o=Math.max(0,e.lineLength(n)-1);return Math.min(t.col,o)}function Ze(e,t,n,r){let o=r.buffer,s=t.linewise?t.normalized():an(o,t,n),{start:i,linewise:x}=s;switch(e){case"d":{r.registers.record({text:o.textOf(s),linewise:x},r.register),o.remove(s);let c=Math.min(i.line,o.lineCount()-1);return{cursor:new f(c,I0(o,i,c,x)),enter_insert:!1}}case"c":{let c=x&&i.line===0&&s.end.line>=o.lineCount()-1;if(r.registers.record({text:o.textOf(s),linewise:x},r.register),o.remove(s),x&&!c)o.lines.splice(i.line,0,"");let a=x?0:Math.min(i.col,o.lineLength(i.line));return{cursor:new f(i.line,a),enter_insert:!0}}case"y":{r.registers.recordYank({text:o.textOf(s),linewise:x},r.register);let c=Math.min(i.line,o.lineCount()-1);return{cursor:new f(c,I0(o,i,c,x)),enter_insert:!1}}case"<":case">":{let c=Math.min(i.line,o.lineCount()-1),a=Math.min(s.end.line,o.lineCount()-1);for(let l=c;l<=a;l++){let u=o.lineText(l);o.lines[l]=e===">"?on+u:sn(u)}return o.modified=!0,{cursor:o.firstNonBlank(c),enter_insert:!1}}case"gu":case"gU":case"g~":return{cursor:cn(o,s,e==="gu"?"lower":e==="gU"?"upper":"toggle"),enter_insert:!1}}return null}function Re(e,t,n,r){let o=e.lineLength(t.line);switch(r){case"x":case"s":case"~":{if(o===0||t.col>=o)return null;return new A(t,new f(t.line,Math.min(o,t.col+n)),!1)}case"X":{if(t.col===0)return null;let s=Math.max(0,t.col-n);return new A(new f(t.line,s),new f(t.line,t.col),!1)}case"D":case"C":{let s=Math.min(e.lineCount()-1,t.line+n-1);return new A(t,new f(s,e.lineLength(s)),!1)}case"S":{let s=Math.min(e.lineCount()-1,t.line+n-1);return new A(new f(t.line,0),new f(s,0),!0)}}return null}function F0(e){let t=e.repeat_last;if(t===null)return;switch(t.kind){case"operator":{me(e,t);return}case"change":{let n={kind:"operator",operator:t.operator,motion:t.motion,linewise:t.linewise,count:t.count,register:t.register};if(me(e,n),e.mode==="insert"&&e.session!==null)e.session.change_base=null,de(e,t.text),ce(e);e.repeat_last=t;return}case"sugar_change":{let n=Re(e.buffer,e.cursor.pos,t.count,t.key);if(n===null)return;let r=t.key==="S"?"linewise":"exclusive";le(e,"c",n,r,t.register),Qe(e,t.key,t.count,t.register),de(e,t.text),ce(e);return}case"insert":{S0(e,t.location,t.count,t.text),e.repeat_last=t;return}case"replace_text":{W(e,"insert",t.count,!0),de(e,t.text),ce(e),e.repeat_last=t;return}case"repeat_simple":{pe(e,{kind:"simple",key:t.key,count:t.count,char:t.char,register:t.register}),e.repeat_last=t;return}}}function N0(e,t){if(t.name==="j"||t.name==="k"){Me(e,t.count,t.name==="j");return}let n=Je(t,e.cursor.pos,e.motionContext());if(n===null){if(t.name==="n"||t.name==="N")e.flash(fe+e.search.pattern);return}if(D0(e,t),qe(t.name))e.last_jump=e.cursor.pos;if(n.kind==="linewise"){e.cursor.setExact(e.buffer.firstNonBlank(n.to.line));return}e.placeCursor(n.to)}function Me(e,t,n){let r=Math.max(1,t),o=e.layout.displayRows,s=e.layout.bufferToScreen(e.cursor.pos),x=(e.layout.firstRowOfLine[e.cursor.pos.line]??0)+s.row,c=n?r:-r,a=Math.max(0,Math.min(o.length-1,x+c)),l=o[a];if(l===void 0)return;if(l.line!==e.cursor.pos.line){let d=e.layout.rawRowCount(l.line);if(d!==null){e.layout.setRawLine(l.line);let m=n?0:d-1,p=e.cursor.sticky??s.col;e.cursor.sticky=p,e.cursor.pos=e.layout.bufferAtVisibleCol(l.line,m,p);return}}let u=e.cursor.sticky??s.col;e.cursor.sticky=u;let h=e.layout.bufferAtVisibleCol(l.line,l.row_in_line,u);e.cursor.pos=h}var ln=["f","F","t","T"];function D0(e,t){if(!ln.includes(t.name))return;let n=t.name==="f"||t.name==="t",r=t.name==="t"||t.name==="T";e.last_char_search={char:t.char??"",forward:n,before_target:r}}function O0(e,t){return{buffer:e.buffer,registers:e.registers,register:t}}function me(e,t){let n,r="linewise";if(t.linewise||t.motion===null){let i=e.cursor.pos.line,x=Math.min(e.buffer.lineCount()-1,i+t.count-1);n=new A(new f(i,0),new f(x,0),!0)}else{let i=un(e,t.operator,t.motion),x=Je(i,e.cursor.pos,e.motionContext());if(x===null){if(i.name==="n"||i.name==="N")e.flash(fe+e.search.pattern);return}D0(e,i),r=x.kind;let c=x.kind==="inclusive"?x.to.withCol(x.to.col+1):x.to;n=x.kind==="linewise"?new A(new f(e.cursor.pos.line,0),new f(x.to.line,0),!0):new A(e.cursor.pos,c,!1)}if(t.operator!=="y")e.rememberState();let o=O0(e,t.register),s=Ze(t.operator,n,r,o);if(s===null)return;if(e.afterEdit(n.normalized().start.line),e.cursor.setExact(s.cursor),s.enter_insert){e.session={location:"insert",count:1,start:e.cursor.pos,replace:!1,change_base:{operator:t.operator,motion:t.motion,linewise:t.linewise,count:t.count,register:t.register}},e.mode="insert";return}if(e.clampCursor(),t.operator!=="c")e.repeat_last=t}function un(e,t,n){let r=n.name==="w"||n.name==="W";if(t!=="c"||!r||e.buffer.isBlankAt(e.cursor.pos))return n;return{...n,name:n.name==="w"?"e":"E"}}function Qe(e,t,n,r){e.mode="insert",e.session={location:"insert",count:1,start:e.cursor.pos,replace:!1,change_base:{operator:"c",motion:null,linewise:t==="S",count:n,register:r,sugar:t}}}function le(e,t,n,r,o){if(t!=="y")e.rememberState();let s=O0(e,o),i=Ze(t,n,r,s);if(i===null)return;if(e.afterEdit(n.normalized().start.line),e.cursor.setExact(i.cursor),!i.enter_insert)e.clampCursor()}function pe(e,t){let{key:n,count:r,char:o,register:s}=t,i=e.cursor.pos;switch(n){case"r":{let x=e.buffer.lineLength(i.line);if(o===void 0||x===0||i.col>=x)return;e.rememberState();let c=Math.min(r,x-i.col),a=e.buffer.lineText(i.line),l=a.slice(0,i.col),u=a.slice(i.col+c);e.buffer.lines[i.line]=l+o.repeat(c)+u,e.buffer.modified=!0,e.afterEdit(i.line),e.cursor.setExact(new f(i.line,i.col+c-1)),e.repeat_last={kind:"repeat_simple",key:n,count:r,char:o,register:s};return}case"x":case"X":case"D":case"C":case"s":case"S":case"~":{let x=Re(e.buffer,i,r,n);if(x===null)return;let a=n==="D"||n==="x"||n==="X"?"d":n==="~"?"g~":"c";if(le(e,a,x,n==="S"?"linewise":"exclusive",s),n==="~"){let l=x.normalized().end;e.cursor.setExact(new f(l.line,Math.max(0,l.col-1)))}else if(a==="c"){Qe(e,n,r,s);return}e.repeat_last={kind:"repeat_simple",key:n,count:r,register:s};return}case"J":{let x=Math.min(Math.max(1,r-1),e.buffer.lineCount()-1-i.line);if(x<=0)return;e.rememberState();let c=e.buffer.lineLength(i.line);for(let a=0;a<x;a++)e.buffer.joinLine(i.line);e.afterEdit(i.line),e.cursor.setExact(new f(i.line,c)),e.repeat_last={kind:"repeat_simple",key:n,count:r,register:s};return}case"p":e.put(!1,r,s);return;case"P":e.put(!0,r,s);return;case"u":e.undo();return;case"U":e.undoLine();return;case".":F0(e);return;case"R":W(e,"insert",r,!0);return;case"i":W(e,"insert",r,!1);return;case"I":W(e,"line_start",r,!1);return;case"a":W(e,"append",r,!1);return;case"A":W(e,"append_eol",r,!1);return;case"o":W(e,"open_below",r,!1);return;case"O":W(e,"open_above",r,!1);return;case"m":e.marks.set(o??"",e.cursor.pos);return;case"<c-f>":case"<c-b>":case"<c-d>":case"<c-u>":{let x=n==="<c-f>"||n==="<c-d>",a=n==="<c-d>"||n==="<c-u>"?Math.floor(e.viewport.rows/2):e.viewport.rows-2;Me(e,Math.max(1,a),x);return}}}class e0{buffer;layout;cursor;registers;undo_state;marks;history;viewport;search={pattern:"",forward:!0};last_char_search=null;last_jump=null;mode="normal";pending=null;command_line=null;history_index=null;session=null;repeat_last=null;message=null;constructor(e,t,n){this.buffer=new Ne(e),this.layout=new Oe(this.buffer,t,n),this.cursor=new De,this.registers=new Ue,this.undo_state=new We,this.marks=new Map,this.history=[],this.viewport={top:0,rows:24}}key(e){if(this.message=null,this.mode==="command_line")P0(this,e);else if(this.mode==="insert"||this.mode==="replace")Xe(this,e);else this.normalKey(e);this.clampCursor()}flash(e){this.message=e}placeCursor(e){this.cursor.setExact(e),this.clampCursor()}deleteRange(e){le(this,"d",e,"linewise")}yankRange(e){le(this,"y",e,"linewise")}putRange(){pe(this,{kind:"simple",key:"p",count:1})}motionContext(){return{buffer:this.buffer,layout:this.layout,marks:this.marks,last_char_search:this.last_char_search,last_jump:this.last_jump,search:this.search,viewport_top:this.viewport.top,screen_rows:this.viewport.rows}}rememberState(){let e={lines:[...this.buffer.lines],cursor:this.cursor.pos};this.undo_state.remember(e),this.undo_state.touchLine(this.cursor.pos.line,e)}afterEdit(e){this.layout.invalidateFrom(e)}clampCursor(){let e=Math.max(0,Math.min(this.buffer.lineCount()-1,this.cursor.pos.line)),n=this.mode==="insert"||this.mode==="replace"?this.buffer.lineLength(e):this.buffer.lastCol(e).col;this.cursor.pos=new f(e,Math.min(this.cursor.pos.col,n))}undo(){this.restore(this.undo_state.take({lines:[...this.buffer.lines],cursor:this.cursor.pos}),"Already at oldest change")}undoLine(){this.restore(this.undo_state.takeLine(),"Nothing to undo on this line")}restore(e,t){if(e===null){this.flash(t);return}this.buffer.lines=[...e.lines],this.buffer.modified=!0,this.layout.invalidateFrom(0),this.cursor.setExact(e.cursor)}put(e,t,n){let r=this.registers.read(n);if(r===null){this.flash("E353: Nothing in register "+(n??""));return}this.rememberState();let o=this.cursor.pos;if(r.linewise){let a=r.text.repeat(Math.max(1,t)).replace(/\n$/,"").split(`
`),l=e?o.line:o.line+1;this.buffer.lines.splice(l,0,...a),this.buffer.modified=!0,this.afterEdit(l),this.cursor.setExact(this.buffer.firstNonBlank(l));return}let s=e?o.col:Math.min(this.buffer.lineLength(o.line),o.col+1),i=r.text.repeat(Math.max(1,t)),x=new f(o.line,s);this.buffer.insert(x,i),this.afterEdit(o.line);let c=x.advancedBy(i);this.cursor.setExact(new f(c.line,Math.max(0,c.col-1)))}normalKey(e){let t=L0(this.pending,e);if(this.pending=t.pending,t.command===null)return;switch(t.command.kind){case"motion":N0(this,t.command.motion);break;case"operator":me(this,t.command);break;case"simple":pe(this,t.command);break;case"command_line":this.mode="command_line",this.command_line={prompt:t.command.prompt,text:""},this.history_index=null;break;case"invalid":this.pending=null;break}}}var G0=2,hn=0.95,fn=0.01;class t0{editor;canvas;viewport;screenToBuffer;dragging=!1;drag=null;row_velocity=0;row_remainder=0;constructor(e,t,n,r){this.editor=e,this.canvas=t,this.viewport=n,this.screenToBuffer=r}attach(){this.canvas.addEventListener("wheel",(e)=>{let t=e.detail.rows;if(t===0||this.editor.mode==="command_line")return;Me(this.editor,Math.abs(t),t>0)}),this.canvas.addEventListener("keydown",(e)=>{let t=e.detail,n=this.token(t);if(n===null)return;t.prevent_default(),e.stopImmediatePropagation(),this.editor.key(n)})}update(){if(this.canvas.mouse_down){this.stopMomentum(),this.updatePressed();return}if(this.dragging)this.dragging=!1,this.drag=null,this.canvas.mouse_owner="",this.canvas.mouse_click=!1;this.coast()}isPanning(){return this.dragging||this.row_velocity!==0}placeClick(){if(this.canvas.mouse_click)this.placeFromMouse()}updatePressed(){let{mouse_row:e,mouse_col:t,mouse_down_row:n,mouse_down_col:r}=this.canvas;if(!(e!==void 0&&t!==void 0&&n!==void 0&&r!==void 0))return;if(!this.dragging){if(!(e!==n||t!==r)||this.canvas.mouse_owner!=="")return;this.startDrag(n,r)}let s=this.drag;if(s===null)return;let i=e-s.last_row;this.row_velocity=Math.max(-G0,Math.min(G0,i)),s.last_row=e;let x=s.start_top-(e-s.start_row),c=this.editor.layout.displayRows.length;this.viewport.scrollTo(x,c,this.canvas.rows)}startDrag(e,t){this.dragging=!0,this.canvas.mouse_owner="vi",this.drag={start_row:e,start_top:this.viewport.top,last_row:e};let n=this.screenToBuffer(e,t);if(n!==null)this.editor.placeCursor(n)}coast(){if(this.row_velocity===0)return;this.row_remainder+=this.row_velocity;let e=Math.trunc(this.row_remainder);if(e!==0){this.row_remainder-=e;let t=this.editor.layout.displayRows.length;this.viewport.scrollTo(this.viewport.top-e,t,this.canvas.rows)}if(this.row_velocity*=hn,Math.abs(this.row_velocity)<fn)this.stopMomentum()}stopMomentum(){this.row_velocity=0,this.row_remainder=0}placeFromMouse(){if(this.canvas.mouse_row===void 0||this.canvas.mouse_col===void 0)return;let e=this.screenToBuffer(this.canvas.mouse_row,this.canvas.mouse_col);if(e!==null)this.editor.placeCursor(e)}token(e){let t=e.key;if(e.ctrl&&!e.alt&&!e.meta)return{f:"<c-f>",b:"<c-b>",d:"<c-d>",u:"<c-u>"}[t.toLowerCase()]??null;if(e.meta||e.alt||e.ctrl)return null;switch(t){case"Tab":return"\t";case"Enter":return"enter";case"Backspace":return"<bs>";case"Escape":return"esc";case"ArrowUp":return"<up>";case"ArrowDown":return"<down>";case"ArrowLeft":return"<left>";case"ArrowRight":return"<right>"}return t.length===1?t:null}}class n0{text;url;terminal;text_glyphs;line=null;current_spans=[];hovered=null;glyphs=null;constructor(e,t,n){this.terminal=e,this.text=t,this.url=n,this.text_glyphs=new I(t,t.length,{wrap:C.TRUNCATE})}get spans(){return this.current_spans}update(e,t,n,r){let o=this.terminal.canvas,s=e.spansFor(t,t+this.text.length),i=s.some((l)=>o.mouseAt(n+l.row,r+l.from,1,l.to-l.from)),x=s.some((l)=>o.mouseDownAt(n+l.row,r+l.from,1,l.to-l.from));if(i&&x&&o.mouse_click)this.activate();else if(i){o.class_name="pointer";let l=this.url.startsWith("#")?window.location.origin+this.url:this.url;this.terminal.detail_text=" Link: "+l+" "}let c=!dn(this.current_spans,s),a=this.glyphs;if(a===null||e!==this.line||c||i!==this.hovered){let l=i?k.BLACK:k.BRIGHT_CYAN,u=i?k.BRIGHT_CYAN:k.BLACK,h=0;a=e.mapCells((d,m,p)=>{if(!mn(s,m,p))return d;let _=this.text_glyphs.data[h++];if(_===void 0)return d;let v=_&255||32;return(l&15)<<12|(u&15)<<8|v}),this.glyphs=a,this.line=e,this.current_spans=s,this.hovered=i}return a}activate(){if(this.url.startsWith("mailto:")){let e=document.createElement("a");e.href=this.url,e.click()}else if(this.url.startsWith("#"))window.location.hash=this.url;else if(this.url.startsWith("/"))window.location.href=this.url;else window.open(this.url,"_blank")}}function dn(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++){let r=e[n],o=t[n];if(r.row!==o.row||r.from!==o.from||r.to!==o.to)return!1}return!0}function mn(e,t,n){for(let r of e)if(r.row===t&&n>=r.from&&n<r.to)return!0;return!1}var pn=new I("\\F0~",1,{wrap:C.TRUNCATE}),_n={row:0,col:0,rows:1,cols:1},wn=k.WHITE,U0=k.BRIGHT_BLACK,W0=80,gn=179;function bn(e){if(e===0||(e&255)===32)return U0<<12|gn;return e&61695|U0<<8}function vn(e,t){if(e===0)return k.BLACK<<12|t<<8|32;let n=e>>12&15;return(e>>8&15)<<12|n<<8|e&255}class r0{terminal;renderer;dependencies;links=[];texture_glyphs=new Map;frame_regions=[];frame_bar_col=null;constructor(e,t,n){this.terminal=e;this.renderer=t;this.dependencies=n}render(){let e=this.terminal.canvas,{editor:t,layout:n,viewport:r}=this.dependencies;n.setRawLine(t.cursor.pos.line);let o=n.displayRows,s=Math.max(1,e.rows-1),i=this.dependencies.pad_cols,x=n.firstRowOfLine;this.frame_bar_col=n.wrapWidth>W0?W0-1:null,this.frame_regions=n.images().map((c)=>({anchor:c,first_display_row:(x[c.line]??0)+c.row_in_line}));for(let c=0;c<s;c++){let a=r.top+c,l=o[a];if(l===void 0){this.terminal.blit(pn,_n,{row:c,col:0,rows:1,cols:1});continue}this.blitRow(this.preparedRowAt(l,null),l.row_in_line,c,i)}this.drawCursor(s),this.drawLinks(s),this.drawStatus(),this.drawImages(),this.terminal.draw()}blitRow(e,t,n,r){this.terminal.blit(e,{row:t,col:0,rows:1,cols:e.cols},{row:n,col:r,rows:1,cols:e.cols})}preparedRowAt(e,t){let n=this.dependencies.layout.grid(e.line),r=e.row_in_line,o=e.row_in_line===0?this.frame_bar_col:null;return n.mapCells((s,i,x)=>{let c=s;if(x===o)c=bn(c);if(t!==null&&x>=t.from_col&&x<t.to_col)c=vn(c,t.blank_bg);return c},{row:r,col:0,rows:1,cols:n.cols})}drawCursor(e){let{editor:t,layout:n,viewport:r}=this.dependencies;if(t.mode==="command_line")return;let o=n.bufferToScreen(t.cursor.pos),i=(n.firstRowOfLine[t.cursor.pos.line]??0)+o.row-r.top;if(i<0||i>=e)return;let x=this.preparedRowAt({line:t.cursor.pos.line,row_in_line:o.row},{from_col:o.col,to_col:o.col+1,blank_bg:wn});this.terminal.blit(x,{row:o.row,col:o.col,rows:1,cols:1},{row:i,col:this.dependencies.pad_cols+o.col,rows:1,cols:1})}drawLinks(e){let{layout:t,viewport:n}=this.dependencies,r=t.firstRowOfLine,o=this.dependencies.pad_cols,s=t.links();for(let[i,x]of s.entries()){let[c="",a=c]=(x.options??"").split("|"),l=this.links[i];if(l===void 0||l.text!==c||l.url!==a)l=new n0(this.terminal,c,a),this.links[i]=l;let u=t.grid(x.line),h=(r[x.line]??0)-n.top,d=l.update(u,x.index,h,o);for(let m of l.spans){let p=h+m.row;if(p<0||p>=e)continue;this.terminal.blit(d,{row:m.row,col:m.from,rows:1,cols:m.to-m.from},{row:p,col:o+m.from,rows:1,cols:m.to-m.from})}}this.links.length=s.length}drawStatus(){let e=this.terminal.canvas,t=this.terminal.detail_text.length>0?e.rows-2:e.rows-1,n=new I(this.statusText(),e.cols,{wrap:C.TRUNCATE});this.blitRow(n,0,t,0)}statusText(){let e=this.dependencies.editor;if(e.command_line!==null)return`\\F3${e.command_line.prompt}${H0(e.command_line.text)}`;if(e.message!==null)return`\\F1${H0(e.message)}`;let t="NORMAL",n=4;if(e.mode==="insert")t="INSERT",n=2;else if(e.mode==="replace")t="REPLACE",n=1;let r=e.cursor.pos,o=e.buffer.lineCount(),s=e.buffer.modified?" [+]":"",i="\\F0 • \\f7",x=`\\f0\\b${n} ${t} `,c="\\f7\\b0",a=`"${this.dependencies.filename}"${s}`,l=`Ln ${r.line+1}, Col ${r.col+1}`,u=yn(r.line+1,o),h=`${o} line${o===1?"":"s"}${i}${u}`,d=En(e.pending),m=d.length>0?`${i}${d}`:"";return`${x}${c} ${a}${i}${l}${i}${h}${m} `}drawImages(){let{viewport:e,textures:t}=this.dependencies,n=this.terminal.canvas;for(let{anchor:r,first_display_row:o}of this.frame_regions){let s=o-e.top,i=r.col+this.dependencies.pad_cols;if(s>=n.rows||s+r.rows<=0||i>=n.cols)continue;let x=t.get(r.name);if(x===void 0)continue;this.renderer.draw(this.textureGlyphsFor(r.name,r.rows,r.cols),x,{row:s,col:i,rows:r.rows,cols:r.cols})}}textureGlyphsFor(e,t,n){let r=this.dependencies.image_modes[e]??M.SAMPLE,o=`${e}:${r}`,s=this.texture_glyphs.get(o);if(s!==void 0&&s.rows===t&&s.cols===n)return s;let i=ie(t,n,r);return this.texture_glyphs.set(o,i),i}}function yn(e,t){if(t<=1)return"All";if(e<=1)return"Top";if(e>=t)return"Bot";return`${Math.round(e/t*100)}%`}function En(e){if(e===null)return"";let t=[];if(e.register!==null)t.push(`"${e.register}`);else if(e.register_pending)t.push('"');if(e.count1!==null)t.push(`${e.count1}`);if(e.operator!==null)t.push(e.operator);if(e.count2!==null)t.push(`${e.count2}`);if(e.g_pending)t.push("g");if(e.char_command!==null)t.push(e.char_command);if(e.mark_mode!==null)t.push(e.mark_mode);return t.join("")}function H0(e){return e.replaceAll("\\","\\\\")}class o0{top=0;followed_row=null;update(e,t){this.clamp(e,t)}scrollTo(e,t,n){this.top=e,this.clamp(t,n)}resetFollow(){this.followed_row=null}holdCursor(e){this.followed_row=e}follow(e,t,n){if(e===this.followed_row)return;this.followed_row=e;let r=Math.max(1,n-1);if(e<this.top)this.top=e;if(e>this.top+r-1)this.top=e-r+1;this.clamp(t,n)}clamp(e,t){let n=Math.max(0,e-Math.max(1,t-2));this.top=Math.max(0,Math.min(n,this.top))}}class re{canvas;terminal;renderer;editor;viewport=new o0;input;view;textures=new Map;image_modes;pad_cols;before_frame;font=null;resized=!0;constructor(e){this.canvas=e.canvas,this.terminal=new se(this.canvas),this.renderer=new xe(this.canvas),this.pad_cols=e.pad_cols??2,this.image_modes=e.image_modes??{},this.before_frame=e.before_frame??null,this.editor=new e0(e.content,this.wrapWidth(),e.image_limits),this.input=new t0(this.editor,this.canvas,this.viewport,(t,n)=>this.editor.layout.screenToBuffer(this.viewport.top+t,n-this.pad_cols)),this.input.attach(),this.view=new r0(this.terminal,this.renderer,{editor:this.editor,layout:this.editor.layout,viewport:this.viewport,textures:this.textures,image_modes:this.image_modes,pad_cols:this.pad_cols,filename:e.filename}),this.canvas.addEventListener("resize",()=>{this.resized=!0}),this.loadTextures(e.textures??{}),this.loadFont(e.font_path),this.frame()}imageRegions(){return this.editor.layout.images()}wrapWidth(){return Math.max(8,this.canvas.cols-this.pad_cols*2)}loadTextures(e){for(let[t,n]of Object.entries(e)){if(n instanceof WebGLTexture){this.textures.set(t,n);continue}Promise.resolve().then(()=>n(this.canvas.gl)).then((r)=>this.textures.set(t,r)).catch(()=>{return})}}loadFont(e){if(e===void 0)return;B(this.canvas.gl,e).then((t)=>{this.font=t}).catch(()=>{return})}frame=()=>{let e=this.canvas;if(e.rows<8||e.cols<16){e.clear(),this.terminal.clear(),this.terminal.draw(),e.mouse_click=!1,requestAnimationFrame(this.frame);return}if(this.resized)this.resized=!1,this.viewport.resetFollow(),this.editor.layout.setWidth(this.wrapWidth());if(this.font!==null&&e.user_font===null)e.user_font=this.font,this.terminal.use_user_font=!0,this.renderer.use_user_font=!0;if(this.before_frame!==null)this.before_frame();this.editor.viewport.top=this.viewport.top,this.editor.viewport.rows=Math.max(1,e.rows-2),this.input.update(),this.viewport.update(this.editor.layout.displayRows.length,e.rows);let t=this.editor.layout.bufferToScreen(this.editor.cursor.pos),r=(this.editor.layout.firstRowOfLine[this.editor.cursor.pos.line]??0)+t.row;if(this.input.isPanning())this.viewport.holdCursor(r);else this.viewport.follow(r,this.editor.layout.displayRows.length,e.rows);if(this.editor.viewport.top=this.viewport.top,e.clear(),this.terminal.clear(),this.view.render(),this.input.placeClick(),e.mouse_click=!1,e.class_name!==document.body.className)document.body.className=e.class_name;requestAnimationFrame(this.frame)}}class _e{target_width;target_height;dbo;fbo;projection_matrix;background;elapsed;last_time;canvas;is_ready;render_target;constructor(e,t){this.canvas=e,this.background=t;let n=e.gl;if(this.target_width=1024,this.target_height=1024,this.render_target=n.createTexture(),!this.render_target)throw Error("When creating render target");if(n.bindTexture(n.TEXTURE_2D,this.render_target),n.texImage2D(n.TEXTURE_2D,0,n.RGBA,this.target_width,this.target_height,0,n.RGBA,n.UNSIGNED_BYTE,null),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MAG_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE),this.dbo=n.createRenderbuffer(),!this.dbo)throw Error("When creating depth render buffer");if(n.bindRenderbuffer(n.RENDERBUFFER,this.dbo),n.renderbufferStorage(n.RENDERBUFFER,n.DEPTH_COMPONENT16,this.target_width,this.target_height),n.bindRenderbuffer(n.RENDERBUFFER,null),this.fbo=n.createFramebuffer(),!this.fbo)throw Error("When creating frame buffer");n.bindFramebuffer(n.FRAMEBUFFER,this.fbo),n.framebufferTexture2D(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,this.render_target,0),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.DEPTH_ATTACHMENT,n.RENDERBUFFER,this.dbo),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindRenderbuffer(n.RENDERBUFFER,null),n.bindTexture(n.TEXTURE_2D,null),this.projection_matrix=w.create(),this.resize(e.rows,e.cols),this.elapsed=0,this.last_time=performance.now(),this.is_ready=!1}resize(e,t){let n=isFinite(t)?Math.max(1,t):1,r=isFinite(e)?Math.max(1,e):1,o=0.5*n/r,s=Math.PI/4,i=Math.tan(s/2),x=o>=1?s:2*Math.atan(i/o),c=0.1,a=100;w.perspective(this.projection_matrix,x,o,0.1,100)}render(){let e=this.canvas.gl,t=performance.now(),n=Math.min(0.1,(t-this.last_time)/1000);if(this.last_time=t,this.elapsed+=n,e.bindFramebuffer(e.FRAMEBUFFER,this.fbo),e.viewport(0,0,this.target_width,this.target_height),e.enable(e.DEPTH_TEST),e.clearColor(...this.background,1),e.clear(e.COLOR_BUFFER_BIT|e.DEPTH_BUFFER_BIT),this.is_ready)this.draw(this.projection_matrix,this.elapsed,n);e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,this.canvas.width,this.canvas.height),e.disable(e.DEPTH_TEST)}}class ue{static STRIDE=44;vertices=[];addVertex(e,t,n,r){this.vertices.push({position:e,normal:t,tangent:n,uv_coord:r})}get vertex_count(){return this.vertices.length}data(){let e=[];for(let{position:t,normal:n,tangent:r,uv_coord:o}of this.vertices)e.push(...t,...n,...r,...o);return new Float32Array(e)}enableAttributes(e,t,n){e.bindBuffer(e.ARRAY_BUFFER,t),e.vertexAttribPointer(n.position,3,e.FLOAT,!1,ue.STRIDE,0),e.enableVertexAttribArray(n.position),e.vertexAttribPointer(n.normal,3,e.FLOAT,!1,ue.STRIDE,12),e.enableVertexAttribArray(n.normal),e.vertexAttribPointer(n.tangent,3,e.FLOAT,!1,ue.STRIDE,24),e.enableVertexAttribArray(n.tangent),e.vertexAttribPointer(n.uv_coord,2,e.FLOAT,!1,ue.STRIDE,36),e.enableVertexAttribArray(n.uv_coord)}}class we extends ue{indices=[]}var X0=5120,s0=5121,V0=5122,i0=5123,x0=5125,z0=5126,Tn={[X0]:1,[s0]:1,[V0]:2,[i0]:2,[x0]:4,[z0]:4},Rn={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};function Le(e){let t=Math.hypot(e[0],e[1],e[2])||1;return[e[0]/t,e[1]/t,e[2]/t]}function j0(e,t){return[e[1]*t[2]-e[2]*t[1],e[2]*t[0]-e[0]*t[2],e[0]*t[1]-e[1]*t[0]]}function Mn(e,t,n,r){return[e[0]*t+e[4]*n+e[8]*r+e[12],e[1]*t+e[5]*n+e[9]*r+e[13],e[2]*t+e[6]*n+e[10]*r+e[14]]}function An(e,t,n,r){return[e[0]*t+e[4]*n+e[8]*r,e[1]*t+e[5]*n+e[9]*r,e[2]*t+e[6]*n+e[10]*r]}function Ln(e,t,n,r){return[e[0]*t+e[3]*n+e[6]*r,e[1]*t+e[4]*n+e[7]*r,e[2]*t+e[5]*n+e[8]*r]}function Ae(e,t,n){let r=e.accessors[n];if(r.sparse)throw Error("GLB loader: sparse accessors are not supported");let o=Rn[r.type];if(o===void 0)throw Error(`GLB loader: unsupported accessor type ${r.type}`);let s=Tn[r.componentType];if(s===void 0)throw Error(`GLB loader: unsupported component type ${r.componentType}`);let i=e.bufferViews[r.bufferView],x=i.byteStride??o*s,c=(i.byteOffset??0)+(r.byteOffset??0),a=new Float32Array(r.count*o),l=new DataView(t,c);for(let u=0;u<r.count;u++){let h=u*x;for(let d=0;d<o;d++){let m=h+d*s;a[u*o+d]=kn(l,m,r.componentType)}}return{data:a,count:r.count}}function kn(e,t,n){switch(n){case z0:return e.getFloat32(t,!0);case X0:return e.getInt8(t);case s0:return e.getUint8(t);case V0:return e.getInt16(t,!0);case i0:return e.getUint16(t,!0);case x0:return e.getUint32(t,!0);default:throw Error(`GLB loader: unsupported component type ${n}`)}}function Cn(e,t,n){let r=e.accessors[n];if(r.sparse)throw Error("GLB loader: sparse accessors are not supported");let s=(e.bufferViews[r.bufferView].byteOffset??0)+(r.byteOffset??0),i=new DataView(t,s),x=[];for(let c=0;c<r.count;c++)switch(r.componentType){case s0:x.push(i.getUint8(c));break;case i0:x.push(i.getUint16(c*2,!0));break;case x0:x.push(i.getUint32(c*4,!0));break;default:throw Error(`GLB loader: unsupported index component type ${r.componentType}`)}return x}function Pn(e){let[t=0,n=0,r=0,o=1]=e,s=1-2*(n*n+r*r),i=2*(t*n-o*r),x=2*(t*r+o*n),c=2*(t*n+o*r),a=1-2*(t*t+r*r),l=2*(n*r-o*t),u=2*(t*r-o*n),h=2*(n*r+o*t),d=1-2*(t*t+n*n);return new Float32Array([s,c,u,i,a,h,x,l,d])}function Sn(e){if(e.matrix)return new Float32Array(e.matrix);let t=e.translation??[0,0,0],n=e.scale??[1,1,1],r=Pn(e.rotation??[0,0,0,1]),o=w.create();o[0]=r[0],o[1]=r[1],o[2]=r[2],o[4]=r[3],o[5]=r[4],o[6]=r[5],o[8]=r[6],o[9]=r[7],o[10]=r[8];let s=w.translation(t[0],t[1],t[2]);return w.multiply(s,s,o),w.multiply(s,s,w.scale(n[0],n[1],n[2])),s}function Bn(e,t){let n=t-t%3,r=e[n],o=e[n+1],s=e[n+2],i=[o[0]-r[0],o[1]-r[1],o[2]-r[2]],x=[s[0]-r[0],s[1]-r[1],s[2]-r[2]];return Le(j0(i,x))}function In(e,t,n,r){if(!e)return Bn(n,r);let o=e.data[r*3],s=e.data[r*3+1],i=e.data[r*3+2];return Le(Ln(t,o,s,i))}function Fn(e,t,n,r){if(!e){let i=Math.abs(n[1])<0.9?[0,1,0]:[1,0,0];return Le(j0(i,n))}let o=An(t,e.data[r*4],e.data[r*4+1],e.data[r*4+2]),s=n[0]*o[0]+n[1]*o[1]+n[2]*o[2];return Le([o[0]-s*n[0],o[1]-s*n[1],o[2]-s*n[2]])}function Nn(e,t,n,r,o,s,i){if((r.mode??4)!==4)throw Error("GLB loader: only TRIANGLES primitives are supported");let c=r.attributes.POSITION;if(c===void 0)throw Error("GLB loader: primitive is missing POSITION");let a=Ae(t,n,c),l=r.attributes.NORMAL?Ae(t,n,r.attributes.NORMAL):null,u=r.attributes.TEXCOORD_0?Ae(t,n,r.attributes.TEXCOORD_0):null,h=r.attributes.TANGENT?Ae(t,n,r.attributes.TANGENT):null,d=w.create();w.inverseTranspose3x3(d,o);let m=[];for(let _=0;_<a.count;_++){let v=Mn(o,a.data[_*3],a.data[_*3+1],a.data[_*3+2]);m.push(v);for(let E=0;E<3;E++)s.min[E]=Math.min(s.min[E],v[E]),s.max[E]=Math.max(s.max[E],v[E])}for(let _=0;_<a.count;_++){let v=m[_],E=In(l,d,m,_),g=Fn(h,o,E,_),b=u?[u.data[_*2],u.data[_*2+1]]:[0,0];e.addVertex([v[0],v[1],v[2]],[E[0],E[1],E[2]],[g[0],g[1],g[2]],[b[0],b[1]])}let p=r.indices?Cn(t,n,r.indices):[...a.data.keys()];for(let _ of p)e.indices.push(_+i);return a.count}function $0(e,t,n,r,o,s,i){let x=e.nodes?.[o];if(!x)return i;let c=w.create();if(w.multiply(c,s,Sn(x)),x.mesh!==void 0){let a=e.meshes?.[x.mesh];if(a)for(let l of a.primitives)i+=Nn(n,e,t,l,c,r,i)}for(let a of x.children??[])i=$0(e,t,n,r,a,c,i);return i}async function Dn(e){let t=await fetch(e);if(!t.ok)throw Error(`GLB loader: failed to fetch ${e} (${t.status})`);let n=await t.arrayBuffer();if(n.byteLength<20)throw Error("GLB loader: file too small to be a GLB");let r=new DataView(n);if(r.getUint32(0,!0)!==1179937895)throw Error("GLB loader: bad magic");if(r.getUint32(4,!0)!==2)throw Error("GLB loader: unsupported glTF version");let o=r.getUint32(12,!0),s=new TextDecoder().decode(new Uint8Array(n,20,o)),i=JSON.parse(s.replace(/[\0 ]+$/,"")),x=n.slice(20+o+8);return{json:i,bin:x}}async function Y0(e){let{json:t,bin:n}=await Dn(e),r=t.scenes?.[t.scene??0]??t.scenes?.[0];if(!r)throw Error("GLB loader: no scene");let o=new we,s={min:[1/0,1/0,1/0],max:[-1/0,-1/0,-1/0]},i=0,x=w.create();for(let d of r.nodes??[])i=$0(t,n,o,s,d,x,i);if(o.vertex_count===0||o.indices.length===0)throw Error("GLB loader: no triangle mesh found in file");let{min:c,max:a}=s,l=[(c[0]+a[0])/2,(c[1]+a[1])/2,(c[2]+a[2])/2],u=[a[0]-c[0],a[1]-c[1],a[2]-c[2]],h=Math.max(u[0]/2,u[1]/2,u[2]/2)||1;return{mesh:o,center:l,radius:h,size:u}}var K0=`#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec3 a_tangent;
in vec2 a_uv_coord;

uniform mat4 u_projection_matrix;
uniform mat4 u_view_matrix;
uniform mat4 u_model_matrix;
uniform mat3 u_normal_matrix;
uniform vec3 u_light_position;

out mat3 v_TBN;
out vec3 v_position;
out vec2 v_uv_coord;
out vec3 v_light;

const vec2 SNAP_GRID = vec2(320.0, 160.0);

void main() {
	mat4 model_view_matrix = u_view_matrix * u_model_matrix;

	vec3 N = u_normal_matrix * a_normal;
	vec3 T = mat3(model_view_matrix) * a_tangent;
	vec3 B = cross(N, T);

	v_TBN = mat3(T, B, N);
	v_position = vec3(model_view_matrix * vec4(a_position, 1.0));
	v_uv_coord = a_uv_coord;

	v_light = vec3(u_view_matrix * vec4(u_light_position, 1.0));

	vec4 clip = u_projection_matrix * model_view_matrix * vec4(a_position, 1.0);

	vec2 screen = (clip.xy / clip.w) * (SNAP_GRID * 0.5);
	clip.xy = (floor(screen) + 0.5) / (SNAP_GRID * 0.5) * clip.w;

	gl_Position = clip;
}
`;var q0=`#version 300 es

precision mediump float;

const float PI = 3.14159265359;

in mat3 v_TBN;
in vec3 v_position;
in vec2 v_uv_coord;
in vec3 v_light;

uniform sampler2D u_texture;
uniform sampler2D u_normal;
uniform sampler2D u_roughness;
uniform float u_ambient;
uniform float u_light_intensity;

out vec4 frag_colour;

void main() {
	vec3 col = texture(u_texture, v_uv_coord).rgb;

	if (v_light == vec3(0.0)) {
		frag_colour = vec4(col, 1.0);
		return;
	}

	vec3 normal = texture(u_normal, v_uv_coord).rgb;
	normal = normal * 2.0 - 1.0;
	normal = normalize(v_TBN * normal);

	float roughness = texture(u_roughness, v_uv_coord).r;
	float shininess = max(2.0 / pow(max(roughness, 1.0e-4), 4.0) - 2.0, 1.0);

	vec3 L = normalize(v_light - v_position);

	// ambient lighting
	float amb = u_ambient;

	// lambertian diffuse component
	float lam = max(dot(normal, L), 0.0);

	// blinn-phong specular component
	vec3 V = normalize(-v_position);
	vec3 H = normalize(L + V);
	float spec_strength = pow(1.0 - roughness, 2.0);
	float spec = pow(max(dot(normal, H), 0.0), shininess) * step(0.0, lam)
		* ((shininess + 8.0) / (8.0 * PI));

	vec3 shaded = col * min(amb + u_light_intensity * lam, 1.0) * (1.0 - spec_strength)
		+ spec_strength * u_light_intensity * spec;

	frag_colour = vec4(shaded, 1.0);
}
`;class c0{gl;gl_program;constructor(e,t){this.gl=e,this.gl_program=t}}class ge extends c0{mesh;attributes;uniforms;vbo;ibo;constructor(e,t){super(e,Z(e,K0,q0));this.mesh=t,this.attributes=Q(e,this.gl_program,{position:"a_position",normal:"a_normal",tangent:"a_tangent",uv_coord:"a_uv_coord"}),this.uniforms=ee(e,this.gl_program,{projection_matrix:"u_projection_matrix",view_matrix:"u_view_matrix",model_matrix:"u_model_matrix",normal_matrix:"u_normal_matrix",texture:"u_texture",normal:"u_normal",roughness:"u_roughness",light_position:"u_light_position",ambient:"u_ambient",light_intensity:"u_light_intensity"});let n=e.createBuffer();if(!n)throw Error("When creating vertex buffer");this.vbo=n;let r=e.createBuffer();if(!r)throw Error("When creating index buffer");this.ibo=r,e.useProgram(this.gl_program),e.uniform1i(this.uniforms.texture,0),e.uniform1i(this.uniforms.normal,1),e.uniform1i(this.uniforms.roughness,2),e.bindBuffer(e.ARRAY_BUFFER,this.vbo),e.bufferData(e.ARRAY_BUFFER,this.mesh.data(),e.STATIC_DRAW),e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,this.ibo),e.bufferData(e.ELEMENT_ARRAY_BUFFER,new Uint32Array(this.mesh.indices),e.STATIC_DRAW)}draw(e,t,n,r,o,s,i,x,c){let a=this.gl;a.useProgram(this.gl_program),this.mesh.enableAttributes(a,this.vbo,this.attributes),a.uniformMatrix4fv(this.uniforms.projection_matrix,!1,s),a.uniformMatrix4fv(this.uniforms.view_matrix,!1,o),a.uniformMatrix4fv(this.uniforms.model_matrix,!1,r);let l=w.create();w.multiply(l,o,r);let u=new Float32Array(9);w.inverseTranspose3x3(u,l),a.uniformMatrix3fv(this.uniforms.normal_matrix,!1,u),a.uniform3fv(this.uniforms.light_position,x),a.uniform1f(this.uniforms.ambient,i),a.uniform1f(this.uniforms.light_intensity,c),a.activeTexture(a.TEXTURE0),a.bindTexture(a.TEXTURE_2D,e),a.activeTexture(a.TEXTURE1),a.bindTexture(a.TEXTURE_2D,t),a.activeTexture(a.TEXTURE2),a.bindTexture(a.TEXTURE_2D,n),a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,this.ibo),a.drawElements(a.TRIANGLES,this.mesh.indices.length,a.UNSIGNED_INT,0)}}class a0 extends _e{url;texture_path;normal_path;roughness_path;blinn_phong;texture;normal;roughness;center=[0,0,0];scale=1;height=1;constructor(e,t,n,r,o){super(e,R0(e,k.BLACK));this.url=t,this.texture_path=n,this.normal_path=r,this.roughness_path=o}async init(){let e=this.canvas.gl,t=await Y0(this.url);this.blinn_phong=new ge(e,t.mesh),this.center=t.center,this.scale=1.5/t.radius,this.height=t.size[1]*this.scale,[this.texture,this.normal,this.roughness]=await Promise.all([B(e,this.texture_path),B(e,this.normal_path),B(e,this.roughness_path)]);for(let n of[this.texture,this.normal,this.roughness])e.bindTexture(e.TEXTURE_2D,n),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST);this.is_ready=!0}draw(e,t,n){let r=4.5,o=Math.PI/12,s=t/3,i=[r*Math.cos(s)*Math.cos(o),r*Math.sin(o),r*Math.sin(s)*Math.cos(o)],x=w.create();w.lookAt(x,new Float32Array(i),new Float32Array([0,0,0]),new Float32Array([0,-1,0]));let c=w.translation(-this.center[0],-this.center[1],-this.center[2]),a=w.create();w.multiply(a,w.scale(this.scale,this.scale,this.scale),c);let l=a,u=[0,0.5*this.height,2.5];this.blinn_phong.draw(this.texture,this.normal,this.roughness,l,x,e,0.75,u,1.5)}}function J0(e,t,n,r){let o=new we,s=2*Math.PI;for(let x=0;x<=e;x++){let c=x/e,a=s*c,l=Math.cos(a),u=Math.sin(a);for(let h=0;h<=t;h++){let d=h/t,m=s*d,p=Math.cos(m),_=Math.sin(m),v=n+r*p,E=l*v,g=u*v,b=r*_,y=l*p,T=u*p,F=_,N=-u,D=l;o.addVertex([E,g,b],[y,T,F],[N,D,0],[c,d])}}function i(x,c){return x*(t+1)+c}for(let x=0;x<e;x++)for(let c=0;c<t;c++){let a=i(x,c),l=i(x+1,c),u=i(x,c+1),h=i(x+1,c+1);o.indices.push(a),o.indices.push(u),o.indices.push(l),o.indices.push(l),o.indices.push(u),o.indices.push(h)}return o}class J extends _e{static LIGHT_RADIUS=4;static LIGHT_DEPTH=5;static YAW_HALF_RANGE=Math.PI/3;static PITCH_HALF_RANGE=Math.PI/3;static TRACKING_K=4;blinn_phong;texture;normal;roughness;yaw;pitch;constructor(e){super(e,[0,0,0]);this.yaw=0,this.pitch=0}async init(){let e=this.canvas.gl;this.blinn_phong=new ge(e,J0(32,24,4,1)),[this.texture,this.normal,this.roughness]=await Promise.all([B(e,"/images/texture.png"),B(e,"/images/normal.png"),B(e,"/images/roughness.png")]),this.is_ready=!0}draw(e,t,n){let r=w.create();w.lookAt(r,new Float32Array([0,0,16]),new Float32Array([0,0,0]),new Float32Array([0,-1,0]));let o=w.rotation("y",t/1.7),s=w.rotation("x",t/1.9),i=w.rotation("z",t/2.3),x=w.create();w.multiply(x,o,s);let c=w.create();w.multiply(c,x,i);let a=t/2.9,l=[J.LIGHT_RADIUS*Math.cos(a),J.LIGHT_RADIUS*Math.sin(a),J.LIGHT_DEPTH];this.blinn_phong.draw(this.texture,this.normal,this.roughness,c,r,e,0.33,l,0.66)}}var Z0=`Micah Baker
----

\\a2{torus|40|80}\\a2{model|6|12}


	\\f0 \\F7<- me


\\F0.------------------------. \\F7
\\F0: \\F2Micah Baker\\F7's website. \\F0: \\F7
\\F0'------------------------' \\F7

\\f7I am a\\F7:		Software Engineer
\\f7Based in\\F7:	Vancouver, BC, Canada
\\f7Education\\F7:	BSc Computing Science (2022-2028)
\\f7Previously\\F7:	\\a0{Open WebUI|https://openwebui.com}Open_WebUI (2026),
		\\a0{Improving|https://improving.com}Improving (2024-2025),
		\\a0{Brave Technology Coop|https://brave.coop}Brave_Technology_Coop (2023-2024)

\\f7E-mail\\F7:		\\a0{<micah_baker@sfu.ca>|mailto:micah_baker@sfu.ca}<micah_baker@sfu.ca>
\\f7GitHub\\F7:		\\a0{https://github.com/micahdbak}https://github.com/micahdbak
\\f7LinkedIn\\F7:	\\a0{https://linkedin.com/in/micahdbak}https://linkedin.com/in/micahdbak



	This page is a (mostly) functional \\f7vi\\F7 emulator. \\f7vi\\F7 is the original 1976
program which \\f7vim\\F7, and subsequently \\f7neovim\\F7, is based on. Learn how to use \\f7vi\\F7
with the \\a0{vi tutor|/vi.html}vi_tutor (mouse over; computer users only).


	This page was built using \\a0{@micahdbak/tscon|https://github.com/micahdbak/tscon}@micahdbak/tscon, a WebGL 2.0 text-mode
graphics library. \\f7tscon\\F7 is built from from the ground up using browser APIs and
zero third-party libraries. This page uses several \\f7tscon\\F7 escape codes; learn
how to use them with the \\a0{tscon tutor|/tscon.html}tscon_tutor.


	Also, see this \\a0{donut|/donut.html}donut!

`;var Q0=30,et=60,tt=10,nt=20;function rt(){let e=document.getElementById("webgl");try{let t=S.from(e,{palette:K}),n=new a0(t,"/meshes/model.glb","/images/model/texture.png","/images/normal.png","/images/model/roughness.png");n.init(),n.resize(tt,nt);let r=new J(t);r.init(),r.resize(Q0,et);let o={model:n,torus:r},s=new Map([["model",`${tt}x${nt}`],["torus",`${Q0}x${et}`]]),i=null,x=()=>{for(let h of i?.imageRegions()??[]){let d=`${h.rows}x${h.cols}`;if(s.get(h.name)===d)continue;s.set(h.name,d),o[h.name]?.resize(h.rows,h.cols)}},c=Z0,a=c.indexOf(`
`),l=a+1+c.slice(a+1,-1).indexOf(`
`),u=c.slice(l+1,-1);i=new re({canvas:t,content:u,filename:"INDEX",font_path:"/images/font.png",textures:{model:n.render_target,torus:r.render_target},image_modes:{torus:M.GLYPHS},before_frame:()=>{x(),n.render(),r.render()}})}catch(t){console.error(t)}}function ot(){let e=document.getElementById("webgl");try{let t=S.from(e,{palette:K}),n=new se(t),r=new xe(t),o=null;(async()=>{o=await B(t.gl,"/images/font.png")})();let i=new J(t);i.init();let x=ie(t.rows,t.cols,M.BG_GLYPHS);i.resize(t.rows,t.cols);let c=!1;t.addEventListener("resize",()=>{c=!0});let a=()=>{if(t.rows<8||t.cols<16){t.clear(),n.clear(),n.draw(),requestAnimationFrame(a);return}if(c)c=!1,x=ie(t.rows,t.cols,M.BG_GLYPHS),i.resize(t.rows,t.cols);if(o!==null&&t.user_font===null)t.user_font=o,n.use_user_font=!0,r.use_user_font=!0;if(t.clear(),i.render(),r.draw(x,i.render_target,{row:0,col:0,rows:x.rows,cols:x.cols}),n.clear(),n.draw(),t.mouse_click=!1,t.class_name!==document.body.className)document.body.className=t.class_name;requestAnimationFrame(a)};requestAnimationFrame(a)}catch(t){console.error(t)}}var st=`tscon Tutorial
----

\\F0-------------------------------------------------------------------------------
TSCON TUTOR
\\F0-------------------------------------------------------------------------------

tscon is what you're looking at: it is the underlying rendering engine.

All colours, links, and textures are set with tscon escape codes.

Escape codes are rendered when the vi cursor is not on that line.

Hover over a line to see what codes it uses, and to edit those escape codes.

\\F0-------------------------------------------------------------------------------
\\f7ESCAPE CODES
\\F0-------------------------------------------------------------------------------

An escape code starts with a backslash, and influences subsequent characters:

  \\\\\\\\	one literal backslash

  \\\\fX	foreground colour, dark (X = 0-7)
  \\\\FX	foreground colour, bright X (X = 0-7)
  \\\\bX	background colour, dark (X = 0-7)
  \\\\BX	background colour, bright (X = 0-7)

  Background colours:		Foreground colours:
\\b0\\F7\\\\b0\\b1\\f0\\\\b1\\b2\\f0\\\\b2\\b3\\f0\\\\b3\\b4\\f0\\\\b4\\b5\\f0\\\\b5\\b6\\f0\\\\b6\\b7\\f0\\\\b7\\f7\\b0	\\B0\\f0\\\\f0\\b0\\f1\\\\f1\\f2\\\\f2\\f3\\\\f3\\f4\\\\f4\\f5\\\\f5\\f6\\\\f6\\f7\\\\f7\\f7\\b0
\\B0\\F7\\\\B0\\B1\\f0\\\\B1\\B2\\f0\\\\B2\\B3\\f0\\\\B3\\B4\\f0\\\\B4\\B5\\f0\\\\B5\\B6\\f0\\\\B6\\B7\\f0\\\\B7\\f7\\b0	\\b0\\F0\\\\F0\\F1\\\\F1\\F2\\\\F2\\F3\\\\F3\\F4\\\\F4\\F5\\\\F5\\F6\\\\F6\\F7\\\\F7\\f7\\b0

  \\\\aX		anchor in group X (X = 0-9)
  \\\\aX{options}	anchor in group X with options (X = 0-9)

An anchor can be used to make links, or to render page-specific textures.

Here is an \\a0{example|https://example.com}example link.

And here is a photo (of me):

\\a2{portrait|6|12}






\\F0-------------------------------------------------------------------------------
\\f7THE CHARACTER SET (IBM CODE PAGE 437)
\\F0-------------------------------------------------------------------------------

These are the characters this page can display. The labels are hexadecimal
row starts; 00 and FF are blank. Any character outside this grid is blank.

\\F0 00\\f7  ☺☻♥♦♣♠•◘○◙♂♀♪♫☼
\\F0 10\\f7 ►◄↕‼¶§▬↨↑↓→←∟↔▲▼
\\F0 20\\f7  !"#$%&'()*+,-./
\\F0 30\\f7 0123456789:;<=>?
\\F0 40\\f7 @ABCDEFGHIJKLMNO
\\F0 50\\f7 PQRSTUVWXYZ[\\\\]^_
\\F0 60\\f7 \`abcdefghijklmno
\\F0 70\\f7 pqrstuvwxyz{|}~⌂
\\F0 80\\f7 ÇüéâäàåçêëèïîìÄÅ
\\F0 90\\f7 ÉæÆôöòûùÿÖÜ¢£¥₧ƒ
\\F0 A0\\f7 áíóúñÑªº¿⌐¬½¼¡«»
\\F0 B0\\f7 ░▒▓│┤╡╢╖╕╣║╗╝╜╛┐
\\F0 C0\\f7 └┴┬├─┼╞╟╚╔╩╦╠═╬╧
\\F0 D0\\f7 ╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀
\\F0 E0\\f7 αßΓπΣσµτΦΘΩδ∞φε∩
\\F0 F0\\f7 ≡±≥≤⌠⌡÷≈°∙·√ⁿ²■

See also: \\a0{vi tutor|/vi.html}vi_tutor, \\a0{index|/index.html}index

`;function it(){let e=document.getElementById("webgl");try{let t=S.from(e,{palette:K}),n=st,r=n.indexOf(`
`),o=r+1+n.slice(r+1,-1).indexOf(`
`),s=n.slice(o+1,-1);new re({canvas:t,content:s,filename:"TSCON",font_path:"/images/font.png",textures:{portrait:(i)=>B(i,"/images/portrait.jpeg")}})}catch(t){console.error(t)}}var xt=`vi Tutorial
----

\\F0-------------------------------------------------------------------------------
WELCOME TO VI TUTOR
\\F0-------------------------------------------------------------------------------

Welcome. This page is a text editor. The file you are looking at IS the
document: move through it, change it, break it. When you reload the page the
file is new again, because nothing here is saved anywhere. There is no disk.
Trust me.

vi has two faces:

  * COMMAND mode -- every key is an editing command. You start here.
  * INSERT mode -- keys become text. Press Esc to return to command mode.

The status line at the bottom of the screen shows the file name, the mode,
and the ruler (line, column, percent of file).

Each lesson below has exercises on lines marked --->. Everything you do in
this file is real: the deletions delete, the inserts insert, and u undoes
the last of it. Practice freely; the page is restored on reload.

When a lesson says to move to a line, use h j k l or click on it.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 1.1 -- MOVING THE CURSOR
\\F0-------------------------------------------------------------------------------

  j moves down        k moves up
  h moves left        l moves right

1. Move the cursor onto the line below, then wander around it.

---> the quick brown fox jumps over the lazy dog.

2. Words, forward and back. vi sorts characters into three classes: blanks,
   word characters (letters and digits), and punctuation.

  w   start of next word          b   start of previous word
  e   end of next word            ge  end of previous word
  W B E gE   the same, but a "word" is any run of non-blanks

3. Within a line:

  0   column zero         ^  first non-blank        $  last character
  N|  column N (try 20| on the ---> line below)

---> practice makes perfect, and so does repetition.

4. Counts. A number before a command repeats it that many times: 3j moves
   down three lines, 2w two words forward, 5l five characters right.

5. Lines:

  + or Enter   first non-blank of the line below
  -            first non-blank of the line above

\\F0-------------------------------------------------------------------------------
\\f7LESSON 1.2 -- DELETING
\\F0-------------------------------------------------------------------------------

  x   delete the character under the cursor
  X   delete the character before the cursor
  dw  delete to the start of the next word
  d$  delete to the end of the line (D does the same)
  dd  delete the whole line; a count deletes that many lines

1. Move to the ---> line below and delete the doubled words with dw.

---> the the quick quick brown brown fox fox jumped jumped

2. Delete the ---> line itself with dd, then bring it back with u.

---> I am a line. Delete me with dd. Restore me with u.

3. x works on counts too: 4x deletes four characters.

---> xxxxxxxx is eight characters. Take four with 4x, undo with u.

A note on dw at the end of a line: vi deletes to the end of the line rather
than joining the next line onto this one. Lines are only joined by J.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 1.3 -- OPERATORS AND MOTIONS
\\F0-------------------------------------------------------------------------------

The d of deletion can be followed by any motion; the operator deletes from
the cursor to where the motion lands.

  dfx   delete through the next x on the line (f = find)
  dtx   delete up to the next x (t = until, one short)
  d}    delete to the end of the paragraph
  dG    delete to the end of the file (careful!)

1. Move to the ---> line, put the cursor at the front, and press dtx:
   everything up to the x goes, and the x itself is spared. Then u, then
   dfx, which takes the x too.

---> everything before the x is in danger.

2. Move to the ---> line and press d}: the whole paragraph goes, all the
   way to the blank line below. Then u to have it back.

---> a paragraph of one line still ends at the blank line.

3. dG deletes to the end of the file. Try it on this tutorial -- then
   press u and watch every line come back at once.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 2.1 -- INSERT MODE
\\F0-------------------------------------------------------------------------------

Everything so far has happened in command mode. These commands leave it:
typed once, from command mode, they put you in insert mode, where keys
become text. Esc returns to command mode. One keystroke to get in, one to
get out.

  i   insert before the cursor       a  insert after the cursor
  I   insert at first non-blank      A  insert at end of line
  o   open a line below              O  open a line above
  R   enter replace mode: typed keys overwrite, like overtyping

1. Move to the ---> line and put the cursor on the f of "flowers". Press
   i, type "tulip " -- with the space -- and press Esc. To add another,
   move the cursor, press i again, and type away.

---> flowers are nice.

2. Press o: a line opens below, and you are in insert mode on it. Now
   Backspace -- at the start of a line it joins the line above, exactly
   undoing the o. Then Esc. As if nothing happened.

---> press o, then Backspace, then Esc. As if nothing happened.

3. Put the cursor on "split", press i, then Enter: the line splits at
   the cursor. Backspace at the start of the new line rejoins it, with
   nothing lost. Esc when finished.

---> this line will split here and rejoin.

4. Put the cursor on the ---> line and press R: now every key replaces
   the character under the cursor, until Esc. Watch -- REPLACE -- come
   up on the status line while you type.

---> overwrite me (gently)

A liberty: the arrow keys also move the cursor in insert mode. The old
terminals sent arrows as escape sequences, and vi made room for them; so
does this page.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 2.2 -- UNDO, JOIN, REPEAT
\\F0-------------------------------------------------------------------------------

  u   undo the last change. vi keeps ONE level of undo: pressing u again
      toggles the change back. This is not a bug; it is 1976.
  U   undo all changes to the line that changed last
  J   join the next line onto this one with one space
  .   repeat the last change: the operator, the typed text, the count

1. Stand on the first ---> line and press J: the line below joins this
   one, with one space between. Press u to part them again, then J once
   more to keep them together.

---> these two lines
---> yearn to be one.

2. Put the cursor on the first "chop" and press dw: one word goes. Now
   press . -- vi repeats your last change, one chop per press. Carry on
   until the line is gone, then press u and watch it all come back.

---> chop chop chop chop chop chop chop chop

3. . repeats typed text too. Put the cursor on the first "change" and
   press cw, type "amend", and press Esc. Move to the next "change" and
   press .: the deletion and the typing both come back.

---> change this word and this word and this word.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 3.1 -- THE COMMAND LINE, PART ONE: GOING PLACES
\\F0-------------------------------------------------------------------------------

Press : to enter command-line mode. The status line becomes a prompt:
whatever you type appears after it. Enter executes the whole line, Esc
cancels it, and the up and down arrows walk the history.

  :5        go to line five              :$   go to the last line
  :+2       down two lines               :-1  up one line

1. Press :, type $, and press Enter: the last line. Then :1 and Enter
   for the first line, and :0 and Enter for the top (this tutorial has
   no line zero, so vi settles for line one).

\\F0-------------------------------------------------------------------------------
\\f7LESSON 3.2 -- THE COMMAND LINE, PART TWO: SUBSTITUTE
\\F0-------------------------------------------------------------------------------

  :s/old/new        replace the first "old" on the current line
  :s/old/new/       trailing slash allowed; same thing
  :%s/old/new/g     every line; the g replaces every match in a line

Type each command after the : prompt and press Enter. The patterns are
plain text, case-sensitive -- not regular expressions.

1. Move to the ---> line and run :s/fox/gnu/, then :%s/fox/gnu/g and
   watch the second fox fall.

---> the quick brown fox. the fox is quick.

2. Move to the ---> line and run :s/teh/the/ to fix the first typo, then
   :%s/teh/the/g and :%s/lots/loads/g for the rest.

---> teh best of teh web has lots of typo and lots of charm.

3. :d deletes the current line and :y yanks it; :put puts the unnamed
   register back below the cursor line. Like dd and p, with more
   punctuation. A count works: :d 2 takes two lines.

4. Save and quit, vi style:

  :w    "Saved. (To where? There's no disk. Trust me.)"
  :q    "Nowhere to go. You're here forever."
  :q!   the same refusal, with feeling
  :wq   "Saved and quit. Wait-- you can't quit. You're still here."

Unknown commands answer "E492: Not an editor command", as they have since
time immemorial.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 4.1 -- REGISTERS AND PUT
\\F0-------------------------------------------------------------------------------

Every delete and yank lands in the unnamed register, and p and P put it
back:

  p   put after the cursor (charwise) or below the line (linewise)
  P   put before the cursor, or above the line
  "a  prefix: delete or yank into register a ("add, "ayy)
  "A  append to register a. "0 holds the last yank; "1-"9 remember the
      lines you have deleted, newest first.

1. xp swaps two characters: x deletes the character under the cursor,
   and p puts the deleted text back after the cursor. Put the cursor on
   the t at the front of ---> and press xp. Undo with u.

---> th is is xp in action.

2. Move a line: put the cursor on the ---> line and delete it with dd.
   Move down a line with j, then press p: the deleted line returns
   below the cursor.

---> I would rather be below the next line.

3. Named registers survive later deletions. Yank any line with "ayy
   (cursor on it first): a copy lands in register a. Delete a few other
   lines anywhere in the file, move somewhere new, and press "ap: the
   yanked line returns below the cursor, untouched by the deletions.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 4.2 -- SEARCHING
\\F0-------------------------------------------------------------------------------

  /text   search forward          ?text   search backward
  n       repeat in the same direction    N  opposite direction

1. Press /, type lesson, and press Enter: the cursor jumps to the next
   "lesson" after it. Press n to jump to each following one, and N to
   walk back through them.

Search wraps around the end of the file; when it does, vi says so.

  f F   find next/previous occurrence of a character on the line
  t T   like f/F but stop one short
  ;     repeat the last find       ,  repeat it backwards

2. Put the cursor at the front of the ---> line and press fo: the
   cursor jumps to the first o. Each press of ; jumps to the next, and
   , reverses. Visit every o on the line.

---> one two three four five, and a fifth "four" for luck.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 4.3 -- MARKS
\\F0-------------------------------------------------------------------------------

  mx   mark this spot under the name x (a-z)
  \`x   jump to the exact marked position
  'x   jump to the first non-blank of the marked line
  ''   jump back where you came from (the last "jump")

1. Put the cursor on the ---> line and press mz: this spot is saved
   under the name z. Travel far away (G is good), then return with 'z.
   Press '' to jump back to where you were -- and again to come back:
   '' hops between the two ends of your last jump.

---> the centre of the universe (as marked)

\\F0-------------------------------------------------------------------------------
\\f7LESSON 5.1 -- SCREEN MOTIONS AND THE WRAP
\\F0-------------------------------------------------------------------------------

  Ctrl-F  forward one screen     Ctrl-B  back one screen
  Ctrl-D  forward half a screen  Ctrl-U  back half a screen
  H       top line of the screen (Home)
  M       middle line of the screen (Middle)
  L       last line of the screen (Last)

1. Ctrl-F (hold Ctrl, press F) pages forward one screen; Ctrl-B pages
   back. Try a few of each and watch the ruler at the bottom.

2. H, M and L do not scroll -- they jump to the top, middle, and last
   line of the screen as it stands. Press L, then M, then H, watching
   the ruler.

A note on long lines: a physical line too wide for the screen wraps onto
several display rows, and j and k move one display row at a time, so the
cursor never jumps over the continuation. The bar on column 80 marks the
classic print margin; it only shows when the terminal is wide enough, and
continuation rows of a wrapped line have none.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 5.2 -- SENTENCES, PARAGRAPHS, AND MATCHING
\\F0-------------------------------------------------------------------------------

  (   previous sentence       )  next sentence
  {   previous paragraph      }  next paragraph
  %   match the bracket under or after the cursor: () [] {} nest

A sentence ends with ., ! or ? followed by a space; a paragraph ends at a
blank line.

1. Put the cursor on the first line of this paragraph and press } twice.
   The blank lines around lessons are paragraphs too.

2. Move to the ---> line and press % a few times: the cursor hops
   between matching brackets, through any nesting.

---> (never [do "this" {sort of} thing] much)

\\F0-------------------------------------------------------------------------------
\\f7LESSON 6.1 -- OPERATORS, SYSTEMATICALLY
\\F0-------------------------------------------------------------------------------

The real grammar of vi: [count] operator [count] motion. The counts
multiply: 2d3w deletes six words. Operators so far: d c < > y and the case
motions:

  gu{motion}  lowercase the range      gU{motion}  uppercase it
  g~{motion}  toggle its case
  guu gUU g~~  like their doubled cousins dd yy, for the whole line

1. Put the cursor at the front of the ---> line and press gU$: the
   whole line shouts. Press u to bring it back, then gu$ to make it
   whisper, and u again.

---> make me shout. or whisper. TOGGLE ME.

2. c works like d but enters insert mode: cw changes a word, cc a line,
   C to the end of the line. cw is the classic -- vi changes the word
   itself, without eating the space after it. Put the cursor on the
   ---> line, press cw, type a replacement, and press Esc; then u.

---> a word for changing.

3. yy yanks the line under the cursor, yw a word; yanking changes
   nothing, registers only. Stand on the first ---> line and press yy,
   move down to the second, and press p: a copy lands below.

---> yank me.
---> paste below me.

4. > shifts lines right by one shiftwidth (a tab); < shifts them left.
   Press >> on the ---> line, then << to put it back where it was.
   Counts compose: 3>> shifts three lines.

---> shift me right. (Then left.)

\\F0-------------------------------------------------------------------------------
\\f7LESSON 7.1 -- THE MOUSE (ANACHRONISMS WELCOME)
\\F0-------------------------------------------------------------------------------

The original vi had no mouse. Ours humours you:

  * Click to move the cursor.
  * Press and drag to scroll the document. The vi cursor is placed where
    the press began and keeps its source line as the view moves, so the
    drag reads ahead without losing the cursor's place in the file. A
    flick keeps the view moving, then it settles.
  * The wheel moves the cursor a row at a time, like j and k. The screen
    follows the cursor; the wheel never scrolls on its own.

Clicking works on every lesson line above. Go on; nothing is fragile here.

\\F0-------------------------------------------------------------------------------
\\f7LESSON 8.1 -- RICH TEXT, EDITED RAW
\\F0-------------------------------------------------------------------------------

This document can hold links and images. They are written as anchors in
the source text and rendered when the cursor is elsewhere. Underscores
stand in for spaces in the text of a link, so it never splits across rows:

  \\a0{GitHub|https://github.com/micahdbak}GitHub, \\a0{LinkedIn|https://linkedin.com/in/micahdbak}LinkedIn, and the \\a0{main_page|/index.html}main_page.

1. Move the cursor onto the line above: it renders raw -- escapes and
   all -- so you can edit the source directly. Move away, and it
   renders as links again.

2. With the cursor on some other line, click a link: it opens.

That is the whole trick of this page: one file, one format, edits and all.

\\F0-------------------------------------------------------------------------------
\\f7SUMMARY
\\F0-------------------------------------------------------------------------------

  move      h j k l  w b e ge  W B E gE  0 ^ $ |  + - Enter  G
  screens   Ctrl-F Ctrl-B Ctrl-D Ctrl-U   H M L
  text      ( ) { } %   f F t T ; ,   / ? n N
  delete    x X dd D dw d} dfx   J joins
  insert    i a I A o O   R overtypes   Esc returns
  change    cw cc C r ~   gu gU g~   < >
  copy      yy yw "ayy "A   p P "ap xp
  undo      u (toggles)   U (one line)
  repeat    .
  command   :5 :$ :s :%s :d :y :put :w :q :q!
  marks     mx 'x \`x '' \`\`

The vi on this page is a working subset of the real thing. Every command
listed above behaves as the UNIX original does, save the few liberties
confessed along the way, and all of it lives only until reload. When in
doubt, press Esc, then u.

See also: \\a0{tscon tutor|/tscon.html}tscon_tutor, \\a0{index|/index.html}index

`;function ct(){let e=document.getElementById("webgl");try{let t=S.from(e,{palette:K}),n=xt,r=n.indexOf(`
`),o=r+1+n.slice(r+1,-1).indexOf(`
`),s=n.slice(o+1,-1);new re({canvas:t,content:s,filename:"VI",font_path:"/images/font.png"})}catch(t){console.error(t)}}async function Xn(){let e=document.getElementById("atlas"),t="160px 'JetBrains Mono'";await Fe(e,"160px 'JetBrains Mono'")}if(window.location.pathname==="/cp437.html")await Xn();else{let e=document.getElementById("raw"),t=document.getElementById("webgl");if(t.getContext("webgl2"))e.className="hidden",t.className="";try{switch(window.location.pathname){case"/donut.html":ot();break;case"/vi.html":ct();break;case"/tscon.html":it();break;default:rt();break}}catch(r){console.log(r),e.className="",t.className="hidden"}}
