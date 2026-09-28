import{L as wh,_ as Ah,a as Ye,F as Vh,b as vh,d as Rh,i as Qu,p as Ph,g as we,c as ju,e as ys,f as bh,h as xh,j as Wu,k as Sh,C as Ch,r as vo,S as Dh}from"./vendor-firebase-core-BtdME_72.js";import{I as $t,g as Nh,E as kh,X as Lh,a as Oh,b as mi,W as Xr,c as Mh,R as ea,M as Fh,S as Ro}from"./vendor-firestore-transport-C3bRx_XK.js";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let zn="12.19.0";function Uh(r){zn=r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ht=new wh("@firebase/firestore");function pn(){return Ht.logLevel}function T(r,...e){if(Ht.logLevel<=Ye.DEBUG){const t=e.map(ta);Ht.debug(`Firestore (${zn}): ${r}`,...t)}}function H(r,...e){if(Ht.logLevel<=Ye.ERROR){const t=e.map(ta);Ht.error(`Firestore (${zn}): ${r}`,...t)}}function Oe(r,...e){if(Ht.logLevel<=Ye.WARN){const t=e.map(ta);Ht.warn(`Firestore (${zn}): ${r}`,...t)}}function ta(r){if(typeof r=="string")return r;try{return(function(t){return JSON.stringify(t)})(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function V(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,Hu(r,n,t)}function Hu(r,e,t){let n=`FIRESTORE (${zn}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw H(n),new Error(n)}function E(r,e,t,n){let s="Unexpected state";typeof t=="string"?s=t:n=t,r||Hu(e,s,n)}function P(r,e){return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bh(r){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class na{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const s=Bh(40);for(let i=0;i<s.length;++i)n.length<20&&s[i]<t&&(n+=e.charAt(s[i]%62))}return n}}function S(r,e){return r<e?-1:r>e?1:0}function vi(r,e){const t=Math.min(r.length,e.length);for(let n=0;n<t;n++){const s=r.charAt(n),i=e.charAt(n);if(s!==i)return _i(s)===_i(i)?S(s,i):_i(s)?1:-1}return S(r.length,e.length)}const qh=55296,$h=57343;function _i(r){const e=r.charCodeAt(0);return e>=qh&&e<=$h}function Vn(r,e,t){return r.length===e.length&&r.every(((n,s)=>t(n,e[s])))}function Yu(r){return r+"\0"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class q{constructor(e,t){this.comparator=e,this.root=t||ue.EMPTY}insert(e,t){return new q(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,ue.BLACK,null,null))}remove(e){return new q(this.comparator,this.root.remove(e,this.comparator).copy(null,null,ue.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const s=this.comparator(e,n.key);if(s===0)return t+n.left.size;s<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal(((t,n)=>(e(t,n),!1)))}toString(){const e=[];return this.inorderTraversal(((t,n)=>(e.push(`${t}:${n}`),!1))),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new Zr(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new Zr(this.root,e,this.comparator,!1)}getReverseIterator(){return new Zr(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new Zr(this.root,e,this.comparator,!0)}}class Zr{constructor(e,t,n,s){this.isReverse=s,this.nodeStack=[];let i=1;for(;!e.isEmpty();)if(i=t?n(e.key,t):1,t&&s&&(i*=-1),i<0)e=this.isReverse?e.left:e.right;else{if(i===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class ue{constructor(e,t,n,s,i){this.key=e,this.value=t,this.color=n??ue.RED,this.left=s??ue.EMPTY,this.right=i??ue.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,s,i){return new ue(e??this.key,t??this.value,n??this.color,s??this.left,i??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let s=this;const i=n(e,s.key);return s=i<0?s.copy(null,null,null,s.left.insert(e,t,n),null):i===0?s.copy(null,t,null,null,null):s.copy(null,null,null,null,s.right.insert(e,t,n)),s.fixUp()}removeMin(){if(this.left.isEmpty())return ue.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,s=this;if(t(e,s.key)<0)s.left.isEmpty()||s.left.isRed()||s.left.left.isRed()||(s=s.moveRedLeft()),s=s.copy(null,null,null,s.left.remove(e,t),null);else{if(s.left.isRed()&&(s=s.rotateRight()),s.right.isEmpty()||s.right.isRed()||s.right.left.isRed()||(s=s.moveRedRight()),t(e,s.key)===0){if(s.right.isEmpty())return ue.EMPTY;n=s.right.min(),s=s.copy(n.key,n.value,null,null,s.right.removeMin())}s=s.copy(null,null,null,null,s.right.remove(e,t))}return s.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,ue.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,ue.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw V(43730,{key:this.key,value:this.value});if(this.right.isRed())throw V(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw V(27949);return e+(this.isRed()?0:1)}}ue.EMPTY=null,ue.RED=!0,ue.BLACK=!1;ue.EMPTY=new class{constructor(){this.size=0}get key(){throw V(57766)}get value(){throw V(16141)}get color(){throw V(16727)}get left(){throw V(29726)}get right(){throw V(36894)}copy(e,t,n,s,i){return this}insert(e,t,n){return new ue(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class U{constructor(e){this.comparator=e,this.data=new q(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal(((t,n)=>(e(t),!1)))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const s=n.getNext();if(this.comparator(s.key,e[1])>=0)return;t(s.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new Po(this.data.getIterator())}getIteratorFrom(e){return new Po(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach((n=>{t=t.add(n)})),t}isEqual(e){if(!(e instanceof U)||this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(this.comparator(s,i)!==0)return!1}return!0}toArray(){const e=[];return this.forEach((t=>{e.push(t)})),e}toString(){const e=[];return this.forEach((t=>e.push(t))),"SortedSet("+e.toString()+")"}copy(e){const t=new U(this.comparator);return t.data=e,t}}class Po{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function cn(r){return r.hasNext()?r.getNext():void 0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const p={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class I extends Vh{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ue="__name__";class Me{constructor(e,t,n){t===void 0?t=0:t>e.length&&V(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&V(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return Me.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof Me?e.forEach((n=>{t.push(n)})):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let s=0;s<n;s++){const i=Me.compareSegments(e.get(s),t.get(s));if(i!==0)return i}return S(e.length,t.length)}static compareSegments(e,t){const n=Me.isNumericId(e),s=Me.isNumericId(t);return n&&!s?-1:!n&&s?1:n&&s?Me.extractNumericId(e).compare(Me.extractNumericId(t)):vi(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return $t.fromString(e.substring(4,e.length-2))}}class D extends Me{construct(e,t,n){return new D(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toStringWithLeadingSlash(){return`/${this.canonicalString()}`}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new I(p.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter((s=>s.length>0)))}return new D(t)}static emptyPath(){return new D([])}}const zh=/^[_a-zA-Z][_a-zA-Z0-9]*$/;let te=class gn extends Me{construct(e,t,n){return new gn(e,t,n)}static isValidIdentifier(e){return zh.test(e)}canonicalString(){return this.toArray().map((e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),gn.isValidIdentifier(e)||(e="`"+e+"`"),e))).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Ue}static keyField(){return new gn([Ue])}static fromServerFormat(e){const t=[];let n="",s=0;const i=()=>{if(n.length===0)throw new I(p.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let a=!1;for(;s<e.length;){const o=e[s];if(o==="\\"){if(s+1===e.length)throw new I(p.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[s+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new I(p.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=u,s+=2}else o==="`"?(a=!a,s++):o!=="."||a?(n+=o,s++):(i(),s++)}if(i(),a)throw new I(p.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new gn(t)}static emptyPath(){return new gn([])}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ie{constructor(e){this.fields=e,e.sort(te.comparator)}static empty(){return new Ie([])}unionWith(e){let t=new U(te.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new Ie(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return Vn(this.fields,e.fields,((t,n)=>t.isEqual(n)))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Is(r){let e=0;for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function xt(r,e){for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function Gh(r,e){const t=[];for(const n in r)Object.prototype.hasOwnProperty.call(r,n)&&t.push(e(r[n],n,r));return t}function Ju(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class A{constructor(e){this.path=e}static fromPath(e){return new A(D.fromString(e))}static fromName(e){return new A(D.fromString(e).popFirst(5))}static empty(){return new A(D.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&D.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return D.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new A(new D(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xu(r,e,t){if(!t)throw new I(p.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function Kh(r,e,t,n){if(e===!0&&n===!0)throw new I(p.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function bo(r){if(!A.isDocumentKey(r))throw new I(p.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function xo(r){if(A.isDocumentKey(r))throw new I(p.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function Mr(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function qs(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const e=(function(n){return n.constructor?n.constructor.name:null})(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":V(12329,{type:typeof r})}function ye(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new I(p.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=qs(r);throw new I(p.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}function Qh(r,e){if(e<=0)throw new I(p.INVALID_ARGUMENT,`Function ${r}() requires a positive number, but it was: ${e}.`)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function J(r,e){const t={typeString:r};return e&&(t.value=e),t}function Fr(r,e){if(!Mr(r))throw new I(p.INVALID_ARGUMENT,"JSON must be an object");let t;for(const n in e)if(e[n]){const s=e[n].typeString,i="value"in e[n]?{value:e[n].value}:void 0;if(!(n in r)){t=`JSON missing required field: '${n}'`;break}const a=r[n];if(s&&typeof a!==s){t=`JSON field '${n}' must be a ${s}.`;break}if(i!==void 0&&a!==i.value){t=`Expected '${n}' field to equal '${i.value}'`;break}}if(t)throw new I(p.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const So=-62135596800,Co=1e6;class F{static now(){return F.fromMillis(Date.now())}static fromDate(e){return F.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*Co);return new F(t,n)}static fromInstant(e){if(!e||typeof e.t!="bigint")throw new I(p.INVALID_ARGUMENT,"Invalid Temporal.Instant object provided.");return F._fromEpochNanoseconds(e.t)}static _fromEpochNanoseconds(e){let t,n;if(e>=0n)t=Number(e/1000000000n),n=Number(e%1000000000n);else{const s=e%1000000000n;s===0n?(t=Number(e/1000000000n),n=0):(t=Number(e/1000000000n-1n),n=Number(s+1000000000n))}return new F(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new I(p.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new I(p.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<So)throw new I(p.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new I(p.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Co}toInstant(){if(typeof Temporal>"u"||!Temporal.Instant)throw new I(p.FAILED_PRECONDITION,"The Temporal object is not available in the current environment.");const e=1000000000n*BigInt(this.seconds)+BigInt(this.nanoseconds);return Temporal.Instant.__PRIVATE_fromEpochNanoseconds(e)}_compareTo(e){return this.seconds===e.seconds?S(this.nanoseconds,e.nanoseconds):S(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:F._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Fr(e,F._jsonSchema))return new F(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-So;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}F._jsonSchemaVersion="firestore/timestamp/1.0",F._jsonSchema={type:J("string",F._jsonSchemaVersion),seconds:J("number"),nanoseconds:J("number")};/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zu extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Q{constructor(e){this.binaryString=e}static fromBase64String(e){const t=(function(s){try{return atob(s)}catch(i){throw typeof DOMException<"u"&&i instanceof DOMException?new Zu("Invalid base64 string: "+i):i}})(e);return new Q(t)}static fromUint8Array(e){const t=(function(s){let i="";for(let a=0;a<s.length;++a)i+=String.fromCharCode(s[a]);return i})(e);return new Q(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return(function(t){return btoa(t)})(this.binaryString)}toUint8Array(){return(function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return S(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}Q.EMPTY_BYTE_STRING=new Q("");const jh=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function tt(r){if(E(!!r,39018),typeof r=="string"){let e=0;const t=jh.exec(r);if(E(!!t,46558,{timestamp:r}),t[1]){let s=t[1];s=(s+"000000000").substr(0,9),e=Number(s)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:$(r.seconds),nanos:$(r.nanos)}}function $(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function nt(r){return typeof r=="string"?Q.fromBase64String(r):Q.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ec="server_timestamp",tc="__type__",nc="__previous_value__",rc="__local_write_time__";function Ur(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[tc])==null?void 0:n.stringValue)===ec}function Br(r){const e=r.mapValue.fields[nc];return Ur(e)?Br(e):e}function vn(r){const e=tt(r.mapValue.fields[rc].timestampValue);return new F(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wh{constructor(e,t,n,s,i,a,o,u,c,l,h,d,_){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=s,this.ssl=i,this.forceLongPolling=a,this.autoDetectLongPolling=o,this.longPollingOptions=u,this.useFetchStreams=c,this.isUsingEmulator=l,this.apiKey=h,this._customHeaders=d,this.grpcFlowControlWindow=_}}const Ts="(default)";class Yt{constructor(e,t){this.projectId=e,this.database=t||Ts}static empty(){return new Yt("","")}get isDefaultDatabase(){return this.database===Ts}isEqual(e){return e instanceof Yt&&e.projectId===this.projectId&&e.database===this.database}}function Hh(r,e){if(!Object.prototype.hasOwnProperty.apply(r.options,["projectId"]))throw new I(p.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new Yt(r.options.projectId,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zt=-1;function qr(r){return r==null}function Rn(r){return r===0&&1/r==-1/0}function sc(r){return typeof r=="number"&&Number.isInteger(r)&&!Rn(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}function Yh(r){return typeof r=="string"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ra="__type__",ic="__max__",mt={mapValue:{fields:{__type__:{stringValue:ic}}}},sa="__vector__",Jt="value",Ge={nullValue:"NULL_VALUE"},Ae={booleanValue:!0},ae={booleanValue:!1};function X(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?Ur(r)?4:ac(r)?9007199254740991:Zt(r)?10:11:V(28295,{value:r})}function Ne(r,e,t){if(r===e)return!0;const n=X(r);if(n!==X(e))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===e.booleanValue;case 4:return vn(r).isEqual(vn(e));case 3:return(function(i,a){if(typeof i.timestampValue=="string"&&typeof a.timestampValue=="string"&&i.timestampValue.length===a.timestampValue.length)return i.timestampValue===a.timestampValue;const o=tt(i.timestampValue),u=tt(a.timestampValue);return o.seconds===u.seconds&&o.nanos===u.nanos})(r,e);case 5:return r.stringValue===e.stringValue;case 6:return(function(i,a){return nt(i.bytesValue).isEqual(nt(a.bytesValue))})(r,e);case 7:return r.referenceValue===e.referenceValue;case 8:return(function(i,a){return $(i.geoPointValue.latitude)===$(a.geoPointValue.latitude)&&$(i.geoPointValue.longitude)===$(a.geoPointValue.longitude)})(r,e);case 2:return(function(i,a,o){if("integerValue"in i&&"integerValue"in a)return $(i.integerValue)===$(a.integerValue);let u,c;if("doubleValue"in i&&"doubleValue"in a)u=$(i.doubleValue),c=$(a.doubleValue);else{if(!(o!=null&&o.i))return!1;u=$(i.integerValue??i.doubleValue),c=$(a.integerValue??a.doubleValue)}return u===c?!!(o!=null&&o.o)||Rn(u)===Rn(c):!!(o===void 0||o.u)&&isNaN(u)&&isNaN(c)})(r,e,t);case 9:return Vn(r.arrayValue.values||[],e.arrayValue.values||[],((s,i)=>Ne(s,i,t)));case 10:case 11:return(function(i,a,o){const u=i.mapValue.fields||{},c=a.mapValue.fields||{};if(Is(u)!==Is(c))return!1;for(const l in u)if(u.hasOwnProperty(l)&&(c[l]===void 0||!Ne(u[l],c[l],o)))return!1;return!0})(r,e,t);default:return V(52216,{left:r})}}function Ir(r,e){return(r.values||[]).find((t=>Ne(t,e)))!==void 0}function _e(r,e){if(r===e)return 0;const t=X(r),n=X(e);if(t!==n)return S(t,n);switch(t){case 0:case 9007199254740991:return 0;case 1:return S(r.booleanValue,e.booleanValue);case 2:return(function(i,a){const o=$(i.integerValue||i.doubleValue),u=$(a.integerValue||a.doubleValue);return o<u?-1:o>u?1:o===u?0:isNaN(o)?isNaN(u)?0:-1:1})(r,e);case 3:return Do(r.timestampValue,e.timestampValue);case 4:return Do(vn(r),vn(e));case 5:return vi(r.stringValue,e.stringValue);case 6:return(function(i,a){const o=nt(i),u=nt(a);return o.compareTo(u)})(r.bytesValue,e.bytesValue);case 7:return(function(i,a){const o=i.split("/"),u=a.split("/");for(let c=0;c<o.length&&c<u.length;c++){const l=S(o[c],u[c]);if(l!==0)return l}return S(o.length,u.length)})(r.referenceValue,e.referenceValue);case 8:return(function(i,a){const o=S($(i.latitude),$(a.latitude));return o!==0?o:S($(i.longitude),$(a.longitude))})(r.geoPointValue,e.geoPointValue);case 9:return No(r.arrayValue,e.arrayValue);case 10:return(function(i,a){var d,_,y,v;const o=i.fields||{},u=a.fields||{},c=(d=o[Jt])==null?void 0:d.arrayValue,l=(_=u[Jt])==null?void 0:_.arrayValue,h=S(((y=c==null?void 0:c.values)==null?void 0:y.length)||0,((v=l==null?void 0:l.values)==null?void 0:v.length)||0);return h!==0?h:No(c,l)})(r.mapValue,e.mapValue);case 11:return(function(i,a){if(i===mt.mapValue&&a===mt.mapValue)return 0;if(i===mt.mapValue)return 1;if(a===mt.mapValue)return-1;const o=i.fields||{},u=Object.keys(o),c=a.fields||{},l=Object.keys(c);u.sort(),l.sort();for(let h=0;h<u.length&&h<l.length;++h){const d=vi(u[h],l[h]);if(d!==0)return d;const _=_e(o[u[h]],c[l[h]]);if(_!==0)return _}return S(u.length,l.length)})(r.mapValue,e.mapValue);default:throw V(23264,{l:t})}}function Do(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return S(r,e);const t=tt(r),n=tt(e),s=S(t.seconds,n.seconds);return s!==0?s:S(t.nanos,n.nanos)}function No(r,e){const t=r.values||[],n=e.values||[];for(let s=0;s<t.length&&s<n.length;++s){const i=_e(t[s],n[s]);if(i!==void 0&&i!==0)return i}return S(t.length,n.length)}function Pn(r){return Ri(r)}function Ri(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?(function(t){const n=tt(t);return`time(${n.seconds},${n.nanos})`})(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?(function(t){return nt(t).toBase64()})(r.bytesValue):"referenceValue"in r?(function(t){return A.fromName(t).toString()})(r.referenceValue):"geoPointValue"in r?(function(t){return`geo(${t.latitude},${t.longitude})`})(r.geoPointValue):"arrayValue"in r?(function(t){let n="[",s=!0;for(const i of t.values||[])s?s=!1:n+=",",n+=Ri(i);return n+"]"})(r.arrayValue):"mapValue"in r?(function(t){const n=Object.keys(t.fields||{}).sort();let s="{",i=!0;for(const a of n)i?i=!1:s+=",",s+=`${a}:${Ri(t.fields[a])}`;return s+"}"})(r.mapValue):V(61005,{value:r})}function os(r){switch(X(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Br(r);return e?16+os(e):16;case 5:return 2*r.stringValue.length;case 6:return nt(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return(function(n){return(n.values||[]).reduce(((s,i)=>s+os(i)),0)})(r.arrayValue);case 10:case 11:return(function(n){let s=0;return xt(n.fields,((i,a)=>{s+=i.length+os(a)})),s})(r.mapValue);default:throw V(13486,{value:r})}}function Xt(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function Be(r){return!!r&&"integerValue"in r}function Bt(r){return!!r&&"doubleValue"in r}function Tt(r){return Be(r)||Bt(r)}function Et(r){return!!r&&"arrayValue"in r}function be(r){return!!r&&"nullValue"in r}function Ve(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function Gt(r){return!!r&&"mapValue"in r}function Zt(r){var t,n;return((n=(((t=r==null?void 0:r.mapValue)==null?void 0:t.fields)||{})[ra])==null?void 0:n.stringValue)===sa}function Pi(r){var e,t;return(t=(((e=r==null?void 0:r.mapValue)==null?void 0:e.fields)||{})[Jt])==null?void 0:t.arrayValue}function ur(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const e={mapValue:{fields:{}}};return xt(r.mapValue.fields,((t,n)=>e.mapValue.fields[t]=ur(n))),e}if(r.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=ur(r.arrayValue.values[t]);return e}return{...r}}function ac(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===ic}const oc={mapValue:{fields:{[ra]:{stringValue:sa},[Jt]:{arrayValue:{}}}}};function Jh(r){return"nullValue"in r?Ge:"booleanValue"in r?{booleanValue:!1}:"integerValue"in r||"doubleValue"in r?{doubleValue:NaN}:"timestampValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in r?{stringValue:""}:"bytesValue"in r?{bytesValue:""}:"referenceValue"in r?Xt(Yt.empty(),A.empty()):"geoPointValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in r?{arrayValue:{}}:"mapValue"in r?Zt(r)?oc:{mapValue:{}}:V(35942,{value:r})}function Xh(r){return"nullValue"in r?{booleanValue:!1}:"booleanValue"in r?{doubleValue:NaN}:"integerValue"in r||"doubleValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in r?{stringValue:""}:"stringValue"in r?{bytesValue:""}:"bytesValue"in r?Xt(Yt.empty(),A.empty()):"referenceValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in r?{arrayValue:{}}:"arrayValue"in r?oc:"mapValue"in r?Zt(r)?{mapValue:{}}:mt:V(61959,{value:r})}function ko(r,e){const t=_e(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?-1:!r.inclusive&&e.inclusive?1:0}function Lo(r,e){const t=_e(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?1:!r.inclusive&&e.inclusive?-1:0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ie{constructor(e){this.value=e}static empty(){return new ie({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!Gt(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=ur(t)}setAll(e){let t=te.emptyPath(),n={},s=[];e.forEach(((a,o)=>{if(!t.isImmediateParentOf(o)){const u=this.getFieldsMap(t);this.applyChanges(u,n,s),n={},s=[],t=o.popLast()}a?n[o.lastSegment()]=ur(a):s.push(o.lastSegment())}));const i=this.getFieldsMap(t);this.applyChanges(i,n,s)}delete(e){const t=this.field(e.popLast());Gt(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return Ne(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let s=t.mapValue.fields[e.get(n)];Gt(s)&&s.mapValue.fields||(s={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=s),t=s}return t.mapValue.fields}applyChanges(e,t,n){xt(t,((s,i)=>e[s]=i));for(const s of n)delete e[s]}clone(){return new ie(ur(this.value))}}function uc(r){const e=[];return xt(r.fields,((t,n)=>{const s=new te([t]);if(Gt(n)){const i=uc(n.mapValue).fields;if(i.length===0)e.push(s);else for(const a of i)e.push(s.child(a))}else e.push(s)})),new Ie(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $s(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:Rn(e)?"-0":e}}function ia(r){return{integerValue:""+r}}function aa(r,e,t){return sc(e)?ia(e):$s(r,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zs{constructor(){this._=void 0}}function Zh(r,e,t){return r instanceof bn?(function(s,i){const a={fields:{[tc]:{stringValue:ec},[rc]:{timestampValue:{seconds:s.seconds,nanos:s.nanoseconds}}}};return i&&Ur(i)&&(i=Br(i)),i&&(a.fields[nc]=i),{mapValue:a}})(t,e):r instanceof xn?lc(r,e):r instanceof Sn?hc(r,e):r instanceof Cn?(function(s,i){const a=cc(s,i),o=Es(a)+Es(s.h);return Be(a)&&Be(s.h)?ia(o):$s(s.serializer,o)})(r,e):r instanceof Tr?(function(s,i){return Oo(s,i,Math.min)})(r,e):r instanceof Er?(function(s,i){return Oo(s,i,Math.max)})(r,e):void 0}function ed(r,e,t){return r instanceof xn?lc(r,e):r instanceof Sn?hc(r,e):t}function cc(r,e){return r instanceof Cn?Tt(e)?e:{integerValue:0}:null}class bn extends zs{}class xn extends zs{constructor(e){super(),this.elements=e}}function lc(r,e){const t=dc(e);for(const n of r.elements)t.some((s=>Ne(s,n)))||t.push(n);return{arrayValue:{values:t}}}class Sn extends zs{constructor(e){super(),this.elements=e}}function hc(r,e){let t=dc(e);for(const n of r.elements)t=t.filter((s=>!Ne(s,n)));return{arrayValue:{values:t}}}class oa extends zs{constructor(e,t){super(),this.serializer=e,this.h=t}}class Cn extends oa{}class Tr extends oa{}class Er extends oa{}function Oo(r,e,t){if(!Tt(e))return r.h;const n=t(Es(e),Es(r.h));return Be(e)&&Be(r.h)?ia(n):$s(r.serializer,n)}function Es(r){return $(r.integerValue||r.doubleValue)}function dc(r){return Et(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fc{constructor(e,t){this.field=e,this.transform=t}}function td(r,e){return r.field.isEqual(e.field)&&(function(n,s){return n instanceof xn&&s instanceof xn||n instanceof Sn&&s instanceof Sn?Vn(n.elements,s.elements,Ne):n instanceof Cn&&s instanceof Cn||n instanceof Tr&&s instanceof Tr||n instanceof Er&&s instanceof Er?Ne(n.h,s.h):n instanceof bn&&s instanceof bn})(r.transform,e.transform)}class nd{constructor(e,t){this.version=e,this.transformResults=t}}class j{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new j}static exists(e){return new j(void 0,e)}static updateTime(e){return new j(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function us(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}class Gs{}function mc(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new $r(r.key,j.none()):new Gn(r.key,r.data,j.none());{const t=r.data,n=ie.empty();let s=new U(te.comparator);for(let i of e.fields)if(!s.has(i)){let a=t.field(i);a===null&&i.length>1&&(i=i.popLast(),a=t.field(i)),a===null?n.delete(i):n.set(i,a),s=s.add(i)}return new at(r.key,n,new Ie(s.toArray()),j.none())}}function rd(r,e,t){r instanceof Gn?(function(s,i,a){const o=s.value.clone(),u=Fo(s.fieldTransforms,i,a.transformResults);o.setAll(u),i.convertToFoundDocument(a.version,o).setHasCommittedMutations()})(r,e,t):r instanceof at?(function(s,i,a){if(!us(s.precondition,i))return void i.convertToUnknownDocument(a.version);const o=Fo(s.fieldTransforms,i,a.transformResults),u=i.data;u.setAll(_c(s)),u.setAll(o),i.convertToFoundDocument(a.version,u).setHasCommittedMutations()})(r,e,t):(function(s,i,a){i.convertToNoDocument(a.version).setHasCommittedMutations()})(0,e,t)}function cr(r,e,t,n){return r instanceof Gn?(function(i,a,o,u){if(!us(i.precondition,a))return o;const c=i.value.clone(),l=Uo(i.fieldTransforms,u,a);return c.setAll(l),a.convertToFoundDocument(a.version,c).setHasLocalMutations(),null})(r,e,t,n):r instanceof at?(function(i,a,o,u){if(!us(i.precondition,a))return o;const c=Uo(i.fieldTransforms,u,a),l=a.data;return l.setAll(_c(i)),l.setAll(c),a.convertToFoundDocument(a.version,l).setHasLocalMutations(),o===null?null:o.unionWith(i.fieldMask.fields).unionWith(i.fieldTransforms.map((h=>h.field)))})(r,e,t,n):(function(i,a,o){return us(i.precondition,a)?(a.convertToNoDocument(a.version).setHasLocalMutations(),null):o})(r,e,t)}function sd(r,e){let t=null;for(const n of r.fieldTransforms){const s=e.data.field(n.field),i=cc(n.transform,s||null);i!=null&&(t===null&&(t=ie.empty()),t.set(n.field,i))}return t||null}function Mo(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!(function(n,s){return n===void 0&&s===void 0||!(!n||!s)&&Vn(n,s,((i,a)=>td(i,a)))})(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}class Gn extends Gs{constructor(e,t,n,s=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=s,this.type=0}getFieldMask(){return null}}class at extends Gs{constructor(e,t,n,s,i=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=s,this.fieldTransforms=i,this.type=1}getFieldMask(){return this.fieldMask}}function _c(r){const e=new Map;return r.fieldMask.fields.forEach((t=>{if(!t.isEmpty()){const n=r.data.field(t);e.set(t,n)}})),e}function Fo(r,e,t){const n=new Map;E(r.length===t.length,32656,{T:t.length,P:r.length});for(let s=0;s<t.length;s++){const i=r[s],a=i.transform,o=e.data.field(i.field);n.set(i.field,ed(a,o,t[s]))}return n}function Uo(r,e,t){const n=new Map;for(const s of r){const i=s.transform,a=t.data.field(s.field);n.set(s.field,Zh(i,a,e))}return n}class $r extends Gs{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class ua extends Gs{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wt{constructor(e,t){this.position=e,this.inclusive=t}}function Bo(r,e,t){let n=0;for(let s=0;s<r.position.length;s++){const i=e[s],a=r.position[s];if(i.field.isKeyField()?n=A.comparator(A.fromName(a.referenceValue),t.key):n=_e(a,t.data.field(i.field)),i.dir==="desc"&&(n*=-1),n!==0)break}return n}function qo(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!Ne(r.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pc{}class O extends pc{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new id(e,t,n):t==="array-contains"?new ud(e,n):t==="in"?new wc(e,n):t==="not-in"?new cd(e,n):t==="array-contains-any"?new ld(e,n):new O(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new ad(e,n):new od(e,n)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(_e(t,this.value)):t!==null&&X(this.value)===X(t)&&this.matchesComparison(_e(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return V(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class B extends pc{constructor(e,t){super(),this.filters=e,this.op=t,this.I=null}static create(e,t){return new B(e,t)}matches(e){return Dn(this)?this.filters.find((t=>!t.matches(e)))===void 0:this.filters.find((t=>t.matches(e)))!==void 0}getFlattenedFilters(){return this.I!==null||(this.I=this.filters.reduce(((e,t)=>e.concat(t.getFlattenedFilters())),[])),this.I}getFilters(){return Object.assign([],this.filters)}}function Dn(r){return r.op==="and"}function bi(r){return r.op==="or"}function ca(r){return gc(r)&&Dn(r)}function gc(r){for(const e of r.filters)if(e instanceof B)return!1;return!0}function xi(r){if(r instanceof O)return r.field.canonicalString()+r.op.toString()+Pn(r.value);if(ca(r))return r.filters.map((e=>xi(e))).join(",");{const e=r.filters.map((t=>xi(t))).join(",");return`${r.op}(${e})`}}function yc(r,e){return r instanceof O?(function(n,s){return s instanceof O&&n.op===s.op&&n.field.isEqual(s.field)&&Ne(n.value,s.value)})(r,e):r instanceof B?(function(n,s){return s instanceof B&&n.op===s.op&&n.filters.length===s.filters.length?n.filters.reduce(((i,a,o)=>i&&yc(a,s.filters[o])),!0):!1})(r,e):void V(19439)}function Ic(r,e){const t=r.filters.concat(e);return B.create(t,r.op)}function Tc(r){return r instanceof O?(function(t){return`${t.field.canonicalString()} ${t.op} ${Pn(t.value)}`})(r):r instanceof B?(function(t){return t.op.toString()+" {"+t.getFilters().map(Tc).join(" ,")+"}"})(r):"Filter"}class id extends O{constructor(e,t,n){super(e,t,n),this.key=A.fromName(n.referenceValue)}matches(e){const t=A.comparator(e.key,this.key);return this.matchesComparison(t)}}class ad extends O{constructor(e,t){super(e,"in",t),this.keys=Ec("in",t)}matches(e){return this.keys.some((t=>t.isEqual(e.key)))}}class od extends O{constructor(e,t){super(e,"not-in",t),this.keys=Ec("not-in",t)}matches(e){return!this.keys.some((t=>t.isEqual(e.key)))}}function Ec(r,e){var t;return(((t=e.arrayValue)==null?void 0:t.values)||[]).map((n=>A.fromName(n.referenceValue)))}class ud extends O{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return Et(t)&&Ir(t.arrayValue,this.value)}}class wc extends O{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&Ir(this.value.arrayValue,t)}}class cd extends O{constructor(e,t){super(e,"not-in",t)}matches(e){if(Ir(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!Ir(this.value.arrayValue,t)}}class ld extends O{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!Et(t)||!t.arrayValue.values)&&t.arrayValue.values.some((n=>Ir(this.value.arrayValue,n)))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class wr{constructor(e,t="asc"){this.field=e,this.dir=t}}function hd(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class b{static fromTimestamp(e){return new b(e)}static min(){return new b(new F(0,0))}static max(){return new b(new F(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class K{constructor(e,t,n,s,i,a,o){this.key=e,this.documentType=t,this.version=n,this.readTime=s,this.createTime=i,this.data=a,this.documentState=o}static newInvalidDocument(e){return new K(e,0,b.min(),b.min(),b.min(),ie.empty(),0)}static newFoundDocument(e,t,n,s){return new K(e,1,t,b.min(),n,s,0)}static newNoDocument(e,t){return new K(e,2,t,b.min(),b.min(),ie.empty(),0)}static newUnknownDocument(e,t){return new K(e,3,t,b.min(),b.min(),ie.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(b.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=ie.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=ie.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=b.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof K&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new K(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nn=-1;class ws{constructor(e,t,n,s){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=s}}function Si(r){return r.fields.find((e=>e.kind===2))}function Nt(r){return r.fields.filter((e=>e.kind!==2))}ws.UNKNOWN_ID=-1;class cs{constructor(e,t){this.fieldPath=e,this.kind=t}}class Ar{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new Ar(0,Se.min())}}function Ac(r,e){const t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,s=b.fromTimestamp(n===1e9?new F(t+1,0):new F(t,n));return new Se(s,A.empty(),e)}function Vc(r){return new Se(r.readTime,r.key,Nn)}class Se{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new Se(b.min(),A.empty(),Nn)}static max(){return new Se(b.max(),A.empty(),Nn)}}function la(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=A.comparator(r.documentKey,e.documentKey),t!==0?t:S(r.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dd{constructor(e,t=null,n=[],s=[],i=null,a=null,o=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=s,this.limit=i,this.startAt=a,this.endAt=o,this.R=null}}function Ci(r,e=null,t=[],n=[],s=null,i=null,a=null){return new dd(r,e,t,n,s,i,a)}function As(r){const e=P(r);if(e.R===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map((n=>xi(n))).join(","),t+="|ob:",t+=e.orderBy.map((n=>(function(i){return i.field.canonicalString()+i.dir})(n))).join(","),qr(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map((n=>Pn(n))).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map((n=>Pn(n))).join(",")),e.R=t}return e.R}function ha(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!hd(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!yc(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!qo(r.startAt,e.startAt)&&qo(r.endAt,e.endAt)}function Je(r){return!!r.isCorePipeline}function da(r){return!!r.path&&A.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function Vs(r,e){return r.filters.filter((t=>t instanceof O&&t.field.isEqual(e)))}function $o(r,e,t){let n=Ge,s=!0;for(const i of Vs(r,e)){let a=Ge,o=!0;switch(i.op){case"<":case"<=":a=Jh(i.value);break;case"==":case"in":case">=":a=i.value;break;case">":a=i.value,o=!1;break;case"!=":case"not-in":a=Ge}ko({value:n,inclusive:s},{value:a,inclusive:o})<0&&(n=a,s=o)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const a=t.position[i];ko({value:n,inclusive:s},{value:a,inclusive:t.inclusive})<0&&(n=a,s=t.inclusive);break}}return{value:n,inclusive:s}}function zo(r,e,t){let n=mt,s=!0;for(const i of Vs(r,e)){let a=mt,o=!0;switch(i.op){case">=":case">":a=Xh(i.value),o=!1;break;case"==":case"in":case"<=":a=i.value;break;case"<":a=i.value,o=!1;break;case"!=":case"not-in":a=mt}Lo({value:n,inclusive:s},{value:a,inclusive:o})>0&&(n=a,s=o)}if(t!==null){for(let i=0;i<r.orderBy.length;++i)if(r.orderBy[i].field.isEqual(e)){const a=t.position[i];Lo({value:n,inclusive:s},{value:a,inclusive:t.inclusive})>0&&(n=a,s=t.inclusive);break}}return{value:n,inclusive:s}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nn{constructor(e,t=null,n=[],s=[],i=null,a="F",o=null,u=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=s,this.limit=i,this.limitType=a,this.startAt=o,this.endAt=u,this.A=null,this.V=null,this.m=null,this.startAt,this.endAt}}function vc(r,e,t,n,s,i,a,o){return new nn(r,e,t,n,s,i,a,o)}function zr(r){return new nn(r)}function Go(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function fd(r){return A.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function fa(r){return r.collectionGroup!==null}function wn(r){const e=P(r);if(e.A===null){e.A=[];const t=new Set;for(const i of e.explicitOrderBy)e.A.push(i),t.add(i.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(a){let o=new U(te.comparator);return a.filters.forEach((u=>{u.getFlattenedFilters().forEach((c=>{c.isInequality()&&(o=o.add(c.field))}))})),o})(e).forEach((i=>{t.has(i.canonicalString())||i.isKeyField()||e.A.push(new wr(i,n))})),t.has(te.keyField().canonicalString())||e.A.push(new wr(te.keyField(),n))}return e.A}function xe(r){const e=P(r);return e.V||(e.V=md(e,wn(r))),e.V}function md(r,e){if(r.limitType==="F")return Ci(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map((s=>{const i=s.dir==="desc"?"asc":"desc";return new wr(s.field,i)}));const t=r.endAt?new wt(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new wt(r.startAt.position,r.startAt.inclusive):null;return Ci(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function Di(r,e){const t=r.filters.concat([e]);return new nn(r.path,r.collectionGroup,r.explicitOrderBy.slice(),t,r.limit,r.limitType,r.startAt,r.endAt)}function _d(r,e){const t=r.explicitOrderBy.concat([e]);return new nn(r.path,r.collectionGroup,t,r.filters.slice(),r.limit,r.limitType,r.startAt,r.endAt)}function vs(r,e,t){return new nn(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function pd(r,e){return new nn(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),r.limit,r.limitType,e,r.endAt)}function gd(r,e){return ha(xe(r),xe(e))&&r.limitType===e.limitType}function lr(r){return`Query(target=${(function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map((s=>Tc(s))).join(", ")}]`),qr(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map((s=>(function(a){return`${a.field.canonicalString()} (${a.dir})`})(s))).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map((s=>Pn(s))).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map((s=>Pn(s))).join(",")),`Target(${n})`})(xe(r))}; limitType=${r.limitType})`}function Ks(r,e){return e.isFoundDocument()&&(function(n,s){const i=s.key.path;return n.collectionGroup!==null?s.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(i):A.isDocumentKey(n.path)?n.path.isEqual(i):n.path.isImmediateParentOf(i)})(r,e)&&(function(n,s){for(const i of wn(n))if(!i.field.isKeyField()&&s.data.field(i.field)===null)return!1;return!0})(r,e)&&(function(n,s){for(const i of n.filters)if(!i.matches(s))return!1;return!0})(r,e)&&(function(n,s){return!(n.startAt&&!(function(a,o,u){const c=Bo(a,o,u);return a.inclusive?c<=0:c<0})(n.startAt,wn(n),s)||n.endAt&&!(function(a,o,u){const c=Bo(a,o,u);return a.inclusive?c>=0:c>0})(n.endAt,wn(n),s))})(r,e)}function ma(r){return(e,t)=>{let n=!1;for(const s of wn(r)){const i=yd(s,e,t);if(i!==0)return i;n=n||s.field.isKeyField()}return 0}}function yd(r,e,t){const n=r.field.isKeyField()?A.comparator(e.key,t.key):(function(i,a,o){const u=a.data.field(i),c=o.data.field(i);return u!==null&&c!==null?_e(u,c):V(42886)})(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return V(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Id{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var Y,M;function Rc(r){switch(r){case p.OK:return V(64938);case p.CANCELLED:case p.UNKNOWN:case p.DEADLINE_EXCEEDED:case p.RESOURCE_EXHAUSTED:case p.INTERNAL:case p.UNAVAILABLE:case p.UNAUTHENTICATED:return!1;case p.INVALID_ARGUMENT:case p.NOT_FOUND:case p.ALREADY_EXISTS:case p.PERMISSION_DENIED:case p.FAILED_PRECONDITION:case p.ABORTED:case p.OUT_OF_RANGE:case p.UNIMPLEMENTED:case p.DATA_LOSS:return!0;default:return V(15467,{code:r})}}function Pc(r){if(r===void 0)return H("GRPC error has no .code"),p.UNKNOWN;switch(r){case Y.OK:return p.OK;case Y.CANCELLED:return p.CANCELLED;case Y.UNKNOWN:return p.UNKNOWN;case Y.DEADLINE_EXCEEDED:return p.DEADLINE_EXCEEDED;case Y.RESOURCE_EXHAUSTED:return p.RESOURCE_EXHAUSTED;case Y.INTERNAL:return p.INTERNAL;case Y.UNAVAILABLE:return p.UNAVAILABLE;case Y.UNAUTHENTICATED:return p.UNAUTHENTICATED;case Y.INVALID_ARGUMENT:return p.INVALID_ARGUMENT;case Y.NOT_FOUND:return p.NOT_FOUND;case Y.ALREADY_EXISTS:return p.ALREADY_EXISTS;case Y.PERMISSION_DENIED:return p.PERMISSION_DENIED;case Y.FAILED_PRECONDITION:return p.FAILED_PRECONDITION;case Y.ABORTED:return p.ABORTED;case Y.OUT_OF_RANGE:return p.OUT_OF_RANGE;case Y.UNIMPLEMENTED:return p.UNIMPLEMENTED;case Y.DATA_LOSS:return p.DATA_LOSS;default:return V(39323,{code:r})}}(M=Y||(Y={}))[M.OK=0]="OK",M[M.CANCELLED=1]="CANCELLED",M[M.UNKNOWN=2]="UNKNOWN",M[M.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",M[M.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",M[M.NOT_FOUND=5]="NOT_FOUND",M[M.ALREADY_EXISTS=6]="ALREADY_EXISTS",M[M.PERMISSION_DENIED=7]="PERMISSION_DENIED",M[M.UNAUTHENTICATED=16]="UNAUTHENTICATED",M[M.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",M[M.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",M[M.ABORTED=10]="ABORTED",M[M.OUT_OF_RANGE=11]="OUT_OF_RANGE",M[M.UNIMPLEMENTED=12]="UNIMPLEMENTED",M[M.INTERNAL=13]="INTERNAL",M[M.UNAVAILABLE=14]="UNAVAILABLE",M[M.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(const[s,i]of n)if(this.equalsFn(s,e))return i}}has(e){return this.get(e)!==void 0}set(e,t){const n=this.mapKeyFn(e),s=this.inner[n];if(s===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let i=0;i<s.length;i++)if(this.equalsFn(s[i][0],e))return void(s[i]=[e,t]);s.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let s=0;s<n.length;s++)if(this.equalsFn(n[s][0],e))return n.length===1?delete this.inner[t]:n.splice(s,1),this.innerSize--,!0;return!1}forEach(e){xt(this.inner,((t,n)=>{for(const[s,i]of n)e(s,i)}))}isEmpty(){return Ju(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Td=new q(A.comparator);function ee(){return Td}const bc=new q(A.comparator);function Lt(...r){let e=bc;for(const t of r)e=e.insert(t.key,t);return e}function xc(r){let e=bc;return r.forEach(((t,n)=>e=e.insert(t,n.overlayedDocument))),e}function De(){return hr()}function Sc(){return hr()}function hr(){return new ot((r=>r.toString()),((r,e)=>r.isEqual(e)))}const Ed=new q(A.comparator),wd=new U(A.comparator);function C(...r){let e=wd;for(const t of r)e=e.add(t);return e}const Ad=new U(S);function _a(){return Ad}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vd(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vd=new $t([4294967295,4294967295],0);function Ko(r){const e=Vd().encode(r),t=new Fh;return t.update(e),new Uint8Array(t.digest())}function Qo(r){const e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),s=e.getUint32(8,!0),i=e.getUint32(12,!0);return[new $t([t,n],0),new $t([s,i],0)]}class pa{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new ir(`Invalid padding: ${t}`);if(n<0)throw new ir(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new ir(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new ir(`Invalid padding when bitmap length is 0: ${t}`);this.p=8*e.length-t,this.S=$t.fromNumber(this.p)}v(e,t,n){let s=e.add(t.multiply($t.fromNumber(n)));return s.compare(vd)===1&&(s=new $t([s.getBits(0),s.getBits(1)],0)),s.modulo(this.S).toNumber()}D(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.p===0)return!1;const t=Ko(e),[n,s]=Qo(t);for(let i=0;i<this.hashCount;i++){const a=this.v(n,s,i);if(!this.D(a))return!1}return!0}static create(e,t,n){const s=e%8==0?0:8-e%8,i=new Uint8Array(Math.ceil(e/8)),a=new pa(i,s,t);return n.forEach((o=>a.insert(o))),a}insert(e){if(this.p===0)return;const t=Ko(e),[n,s]=Qo(t);for(let i=0;i<this.hashCount;i++){const a=this.v(n,s,i);this.C(a)}}C(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class ir extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kn{constructor(e,t,n,s,i,a){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=s,this.augmentedDocumentUpdates=i,this.resolvedLimboDocuments=a}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const s=new Map;return s.set(e,Gr.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new Kn(b.min(),s,new q(S),ee(),ee(),C())}}class Gr{constructor(e,t,n,s,i){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=s,this.removedDocuments=i}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new Gr(n,t,C(),C(),C())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ls{constructor(e,t,n,s){this.F=e,this.removedTargetIds=t,this.key=n,this.O=s}}class Cc{constructor(e,t){this.targetId=e,this.M=t}}class Dc{constructor(e,t,n=Q.EMPTY_BYTE_STRING,s=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=s}}class jo{constructor(e){this.targetId=e,this.N=0,this.L=Wo(),this.B=Q.EMPTY_BYTE_STRING,this.U=!1,this.k=!0}get current(){return this.U}get resumeToken(){return this.B}get q(){return this.N!==0}get $(){return this.k}K(e){e.approximateByteSize()>0&&(this.k=!0,this.B=e)}W(){let e=C(),t=C(),n=C();return this.L.forEach(((s,i)=>{switch(i){case 0:e=e.add(s);break;case 2:t=t.add(s);break;case 1:n=n.add(s);break;default:V(38017,{changeType:i})}})),new Gr(this.B,this.U,e,t,n)}G(){this.k=!1,this.L=Wo()}j(e,t){this.k=!0,this.L=this.L.insert(e,t)}H(e){this.k=!0,this.L=this.L.remove(e)}J(){this.N+=1}Y(){this.N-=1,E(this.N>=0,3241,{N:this.N,targetId:this.targetId})}Z(){this.k=!0,this.U=!0}}const Zn="WatchChangeAggregator";class Rd{constructor(e){this.X=e,this.ee=new Map,this.te=ee(),this.ne=es(),this.re=ee(),this.ie=es(),this.se=new q(S)}_e(e){for(const t of e.F)e.O&&e.O.isFoundDocument()?this.oe(t,e.O):this.ae(t,e.key,e.O);for(const t of e.removedTargetIds)this.ae(t,e.key,e.O)}ue(e){this.forEachTarget(e,(t=>{const n=this.ee.get(t);if(n)switch(e.state){case 0:this.ce(t)&&n.K(e.resumeToken);break;case 1:n.Y(),n.q||n.G(),n.K(e.resumeToken);break;case 2:n.Y(),n.q||this.removeTarget(t);break;case 3:this.ce(t)&&(n.Z(),n.K(e.resumeToken));break;case 4:this.ce(t)&&(this.le(t),n.K(e.resumeToken));break;default:V(56790,{state:e.state})}else T(Zn,`handleTargetChange received targetChange for untracked target ID (${t}) with state (${e.state})`)}))}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ee.forEach(((n,s)=>{this.ce(s)&&t(s)}))}Ee(e){var t;return Je(e)?e.getPipelineSourceType()==="documents"&&((t=e.getPipelineDocuments())==null?void 0:t.length)===1:da(e)}he(e){const t=e.targetId,n=e.M.count,s=this.Te(t);if(s){const i=s.target;if(this.Ee(i))if(n===0){const a=new A(Je(i)?D.fromString(i.getPipelineDocuments()[0]):i.path);this.ae(t,a,K.newNoDocument(a,b.min()))}else E(n===1,20013,"Single document existence filter with count: "+n);else{const a=this.Pe(t);if(a!==n){const o=this.Ie(e),u=o?this.Re(o,e,a):1;if(u!==0){this.le(t);const c=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.se=this.se.insert(t,c)}}}}}Ie(e){const t=e.M.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:s=0},hashCount:i=0}=t;let a,o;try{a=nt(n).toUint8Array()}catch(u){if(u instanceof Zu)return Oe("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{o=new pa(a,s,i)}catch(u){return Oe(u instanceof ir?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return o.p===0?null:o}Re(e,t,n){return t.M.count===n-this.de(e,t.targetId)?0:2}de(e,t){const n=this.X.getRemoteKeysForTarget(t);let s=0;return n.forEach((i=>{const a=this.X.Ve(),o=`projects/${a.projectId}/databases/${a.database}/documents/${i.path.canonicalString()}`;e.mightContain(o)||(this.ae(t,i,null),s++)})),s}fe(e){const t=new Map;this.ee.forEach(((i,a)=>{const o=this.Te(a);if(o){if(i.current&&this.Ee(o.target)){const u=Je(o.target)?D.fromString(o.target.getPipelineDocuments()[0]):o.target.path,c=new A(u);this.me(c).has(a)||this.pe(a,c)||this.ae(a,c,K.newNoDocument(c,e))}i.$&&(t.set(a,i.W()),i.G())}}));let n=C();this.ie.forEach(((i,a)=>{let o=!0;a.forEachWhile((u=>{const c=this.Te(u);return!c||c.purpose==="TargetPurposeLimboResolution"||(o=!1,!1)})),o&&(n=n.add(i))})),this.te.forEach(((i,a)=>a.setReadTime(e))),this.re.forEach(((i,a)=>a.setReadTime(e)));const s=new Kn(e,t,this.se,this.te,this.re,n);return this.te=ee(),this.ne=es(),this.re=ee(),this.ie=es(),this.se=new q(S),s}oe(e,t){const n=this.ee.get(e);if(!n||!this.ce(e))return void T(Zn,`addDocumentToTarget received document for unknown inactive target (${e})`);const s=this.pe(e,t.key)?2:0;n.j(t.key,s),Je(this.Te(e).target)&&this.Te(e).target.getPipelineFlavor()!=="exact"?this.re=this.re.insert(t.key,t):this.te=this.te.insert(t.key,t),this.ne=this.ne.insert(t.key,this.me(t.key).add(e)),this.ie=this.ie.insert(t.key,this.ge(t.key).add(e))}ae(e,t,n){const s=this.ee.get(e);s&&this.ce(e)?(this.pe(e,t)?s.j(t,1):s.H(t),this.ie=this.ie.insert(t,this.ge(t).delete(e)),this.ie=this.ie.insert(t,this.ge(t).add(e)),n&&(Je(this.Te(e).target)&&this.Te(e).target.getPipelineFlavor()!=="exact"?this.re=this.re.insert(t,n):this.te=this.te.insert(t,n))):T(Zn,`removeDocumentFromTarget received document for unknown or inactive target (${e})`)}removeTarget(e){this.ee.delete(e)}Pe(e){const t=this.ee.get(e);if(!t)return 0;const n=t.W();return this.X.getRemoteKeysForTarget(e).size+n.addedDocuments.size-n.removedDocuments.size}J(e){let t=this.ee.get(e);t||(T(Zn,`recordPendingTargetRequest set up tracking for target ID ${e}`),t=new jo(e),this.ee.set(e,t)),t.J()}ge(e){let t=this.ie.get(e);return t||(t=new U(S),this.ie=this.ie.insert(e,t)),t}me(e){let t=this.ne.get(e);return t||(t=new U(S),this.ne=this.ne.insert(e,t)),t}ce(e){const t=this.Te(e)!==null;return t||T(Zn,"Detected inactive target",e),t}Te(e){const t=this.ee.get(e);return t===void 0||t.q?null:this.X.ye(e)}le(e){this.ee.set(e,new jo(e)),this.X.getRemoteKeysForTarget(e).forEach((t=>{this.ae(e,t,null)}))}pe(e,t){return this.X.getRemoteKeysForTarget(e).has(t)}}function es(){return new q(A.comparator)}function Wo(){return new q(A.comparator)}const Pd={asc:"ASCENDING",desc:"DESCENDING"},bd={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},xd={and:"AND",or:"OR"};class Sd{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function Ni(r,e){return r.useProto3Json||qr(e)?e:{value:e}}function Kt(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function ga(r){const e=tt(r);return new F(e.seconds,e.nanos)}function Nc(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function hs(r,e){return Kt(r,e.toTimestamp())}function oe(r){return E(!!r,49232),b.fromTimestamp(ga(r))}function ya(r,e){return ki(r,e).canonicalString()}function ki(r,e){const t=(function(s){return new D(["projects",s.projectId,"databases",s.database])})(r).child("documents");return e===void 0?t:t.child(e)}function kc(r){const e=D.fromString(r);return E(Gc(e),10190,{key:e.toString()}),e}function kn(r,e){return ya(r.databaseId,e.path)}function Xe(r,e){const t=kc(e);if(t.get(1)!==r.databaseId.projectId)throw new I(p.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new I(p.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new A(Mc(t))}function Lc(r,e){return ya(r.databaseId,e)}function Oc(r){const e=kc(r);return e.length===4?D.emptyPath():Mc(e)}function Li(r){return new D(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function Mc(r){return E(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function Ho(r,e,t){return{name:kn(r,e),fields:t.value.mapValue.fields}}function Cd(r,e,t){const n=Xe(r,e.name),s=oe(e.updateTime),i=e.createTime?oe(e.createTime):b.min(),a=new ie({mapValue:{fields:e.fields}}),o=K.newFoundDocument(n,s,i,a);return t&&o.setHasCommittedMutations(),t?o.setHasCommittedMutations():o}function Dd(r,e){return"found"in e?(function(n,s){E(!!s.found,43571),s.found.name,s.found.updateTime;const i=Xe(n,s.found.name),a=oe(s.found.updateTime),o=s.found.createTime?oe(s.found.createTime):b.min(),u=new ie({mapValue:{fields:s.found.fields}});return K.newFoundDocument(i,a,o,u)})(r,e):"missing"in e?(function(n,s){E(!!s.missing,3894),E(!!s.readTime,22933);const i=Xe(n,s.missing),a=oe(s.readTime);return K.newNoDocument(i,a)})(r,e):V(7234,{result:e})}function Nd(r,e){let t;if("targetChange"in e){e.targetChange;const n=(function(c){return c==="NO_CHANGE"?0:c==="ADD"?1:c==="REMOVE"?2:c==="CURRENT"?3:c==="RESET"?4:V(39313,{state:c})})(e.targetChange.targetChangeType||"NO_CHANGE"),s=e.targetChange.targetIds||[],i=(function(c,l){return c.useProto3Json?(E(l===void 0||typeof l=="string",58123),Q.fromBase64String(l||"")):(E(l===void 0||l instanceof Buffer||l instanceof Uint8Array,16193),Q.fromUint8Array(l||new Uint8Array))})(r,e.targetChange.resumeToken),a=e.targetChange.cause,o=a&&(function(c){const l=c.code===void 0?p.UNKNOWN:Pc(c.code);return new I(l,c.message||"")})(a);t=new Dc(n,s,i,o||null)}else if("documentChange"in e){e.documentChange;const n=e.documentChange;n.document,n.document.name,n.document.updateTime;const s=Xe(r,n.document.name),i=oe(n.document.updateTime),a=n.document.createTime?oe(n.document.createTime):b.min(),o=new ie({mapValue:{fields:n.document.fields}}),u=K.newFoundDocument(s,i,a,o),c=n.targetIds||[],l=n.removedTargetIds||[];t=new ls(c,l,u.key,u)}else if("documentDelete"in e){e.documentDelete;const n=e.documentDelete;n.document;const s=Xe(r,n.document),i=n.readTime?oe(n.readTime):b.min(),a=K.newNoDocument(s,i),o=n.removedTargetIds||[];t=new ls([],o,a.key,a)}else if("documentRemove"in e){e.documentRemove;const n=e.documentRemove;n.document;const s=Xe(r,n.document),i=n.removedTargetIds||[];t=new ls([],i,s,null)}else{if(!("filter"in e))return V(11601,{we:e});{e.filter;const n=e.filter;n.targetId;const{count:s=0,unchangedNames:i}=n,a=new Id(s,i),o=n.targetId;t=new Cc(o,a)}}return t}function Vr(r,e){let t;if(e instanceof Gn)t={update:Ho(r,e.key,e.value)};else if(e instanceof $r)t={delete:kn(r,e.key)};else if(e instanceof at)t={update:Ho(r,e.key,e.data),updateMask:Ud(e.fieldMask)};else{if(!(e instanceof ua))return V(16599,{be:e.type});t={verify:kn(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map((n=>(function(i,a){const o=a.transform;if(o instanceof bn)return{fieldPath:a.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(o instanceof xn)return{fieldPath:a.field.canonicalString(),appendMissingElements:{values:o.elements}};if(o instanceof Sn)return{fieldPath:a.field.canonicalString(),removeAllFromArray:{values:o.elements}};if(o instanceof Cn)return{fieldPath:a.field.canonicalString(),increment:o.h};if(o instanceof Tr)return{fieldPath:a.field.canonicalString(),minimum:o.h};if(o instanceof Er)return{fieldPath:a.field.canonicalString(),maximum:o.h};throw V(20930,{transform:a.transform})})(0,n)))),e.precondition.isNone||(t.currentDocument=(function(s,i){return i.updateTime!==void 0?{updateTime:hs(s,i.updateTime)}:i.exists!==void 0?{exists:i.exists}:V(27497)})(r,e.precondition)),t}function Oi(r,e){const t=e.currentDocument?(function(i){return i.updateTime!==void 0?j.updateTime(oe(i.updateTime)):i.exists!==void 0?j.exists(i.exists):j.none()})(e.currentDocument):j.none(),n=e.updateTransforms?e.updateTransforms.map((s=>(function(a,o){let u=null;if("setToServerValue"in o)E(o.setToServerValue==="REQUEST_TIME",16630,{proto:o}),u=new bn;else if("appendMissingElements"in o){const l=o.appendMissingElements.values||[];u=new xn(l)}else if("removeAllFromArray"in o){const l=o.removeAllFromArray.values||[];u=new Sn(l)}else"increment"in o?u=new Cn(a,o.increment):"minimum"in o?u=new Tr(a,o.minimum):"maximum"in o?u=new Er(a,o.maximum):V(16584,{proto:o});const c=te.fromServerFormat(o.fieldPath);return new fc(c,u)})(r,s))):[];if(e.update){e.update.name;const s=Xe(r,e.update.name),i=new ie({mapValue:{fields:e.update.fields}});if(e.updateMask){const a=(function(u){const c=u.fieldPaths||[];return new Ie(c.map((l=>te.fromServerFormat(l))))})(e.updateMask);return new at(s,i,a,t,n)}return new Gn(s,i,t,n)}if(e.delete){const s=Xe(r,e.delete);return new $r(s,t)}if(e.verify){const s=Xe(r,e.verify);return new ua(s,t)}return V(1463,{proto:e})}function kd(r,e){return r&&r.length>0?(E(e!==void 0,14353),r.map((t=>(function(s,i){let a=s.updateTime?oe(s.updateTime):oe(i);return a.isEqual(b.min())&&(a=oe(i)),new nd(a,s.transformResults||[])})(t,e)))):[]}function Fc(r,e){return{documents:[Lc(r,e.path)]}}function Uc(r,e){const t={structuredQuery:{}},n=e.path;let s;e.collectionGroup!==null?(s=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(s=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=Lc(r,s);const i=(function(c){if(c.length!==0)return zc(B.create(c,"and"))})(e.filters);i&&(t.structuredQuery.where=i);const a=(function(c){if(c.length!==0)return c.map((l=>(function(d){return{field:yn(d.field),direction:Od(d.dir)}})(l)))})(e.orderBy);a&&(t.structuredQuery.orderBy=a);const o=Ni(r,e.limit);return o!==null&&(t.structuredQuery.limit=o),e.startAt&&(t.structuredQuery.startAt=(function(c){return{before:c.inclusive,values:c.position}})(e.startAt)),e.endAt&&(t.structuredQuery.endAt=(function(c){return{before:!c.inclusive,values:c.position}})(e.endAt)),{Se:t,parent:s}}function Bc(r){let e=Oc(r.parent);const t=r.structuredQuery,n=t.from?t.from.length:0;let s=null;if(n>0){E(n===1,65062);const l=t.from[0];l.allDescendants?s=l.collectionId:e=e.child(l.collectionId)}let i=[];t.where&&(i=(function(h){const d=$c(h);return d instanceof B&&ca(d)?d.getFilters():[d]})(t.where));let a=[];t.orderBy&&(a=(function(h){return h.map((d=>(function(y){return new wr(In(y.field),(function(R){switch(R){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}})(y.direction))})(d)))})(t.orderBy));let o=null;t.limit&&(o=(function(h){let d;return d=typeof h=="object"?h.value:h,qr(d)?null:d})(t.limit));let u=null;t.startAt&&(u=(function(h){const d=!!h.before,_=h.values||[];return new wt(_,d)})(t.startAt));let c=null;return t.endAt&&(c=(function(h){const d=!h.before,_=h.values||[];return new wt(_,d)})(t.endAt)),vc(e,s,a,i,o,"F",u,c)}function Ld(r,e){const t=(function(s){switch(s){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return V(28987,{purpose:s})}})(e.purpose);return t==null?null:{"goog-listen-tags":t}}function qc(r,e){return{structuredPipeline:{pipeline:{stages:e.stages.map((t=>t._toProto(r)))}}}}function $c(r){return r.unaryFilter!==void 0?(function(t){switch(t.unaryFilter.op){case"IS_NAN":const n=In(t.unaryFilter.field);return O.create(n,"==",{doubleValue:NaN});case"IS_NULL":const s=In(t.unaryFilter.field);return O.create(s,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const i=In(t.unaryFilter.field);return O.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const a=In(t.unaryFilter.field);return O.create(a,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return V(61313);default:return V(60726)}})(r):r.fieldFilter!==void 0?(function(t){return O.create(In(t.fieldFilter.field),(function(s){switch(s){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return V(58110);default:return V(50506)}})(t.fieldFilter.op),t.fieldFilter.value)})(r):r.compositeFilter!==void 0?(function(t){return B.create(t.compositeFilter.filters.map((n=>$c(n))),(function(s){switch(s){case"AND":return"and";case"OR":return"or";default:return V(1026)}})(t.compositeFilter.op))})(r):V(30097,{filter:r})}function Od(r){return Pd[r]}function Md(r){return bd[r]}function Fd(r){return xd[r]}function yn(r){return{fieldPath:r.canonicalString()}}function In(r){return te.fromServerFormat(r.fieldPath)}function zc(r){return r instanceof O?(function(t){if(t.op==="=="){if(Ve(t.value))return{unaryFilter:{field:yn(t.field),op:"IS_NAN"}};if(be(t.value))return{unaryFilter:{field:yn(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Ve(t.value))return{unaryFilter:{field:yn(t.field),op:"IS_NOT_NAN"}};if(be(t.value))return{unaryFilter:{field:yn(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:yn(t.field),op:Md(t.op),value:t.value}}})(r):r instanceof B?(function(t){const n=t.getFilters().map((s=>zc(s)));return n.length===1?n[0]:{compositeFilter:{op:Fd(t.op),filters:n}}})(r):V(54877,{filter:r})}function Ud(r){const e=[];return r.fields.forEach((t=>e.push(t.canonicalString()))),{fieldPaths:e}}function Gc(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}function Kc(r){return!!r&&typeof r._toProto=="function"&&r._protoValueType==="ProtoValue"}function vr(r,e){const t={fields:{}};return e.forEach(((n,s)=>{if(typeof s!="string")throw new Error(`Cannot encode map with non-string key: ${s}`);t.fields[s]=n._toProto(r)})),{mapValue:t}}function Qc(r){return{stringValue:r}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qs(r){return new Sd(r,!0)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pe{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Pe(Q.fromBase64String(e))}catch(t){throw new I(p.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Pe(Q.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Pe._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Fr(e,Pe._jsonSchema))return Pe.fromBase64String(e.bytes)}}Pe._jsonSchemaVersion="firestore/bytes/1.0",Pe._jsonSchema={type:J("string",Pe._jsonSchemaVersion),bytes:J("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qn{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new I(p.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new te(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function Bd(){return new Qn(Ue)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class js{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ke{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new I(p.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new I(p.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return S(this._lat,e._lat)||S(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Ke._jsonSchemaVersion}}static fromJSON(e){if(Fr(e,Ke._jsonSchema))return new Ke(e.latitude,e.longitude)}}Ke._jsonSchemaVersion="firestore/geoPoint/1.0",Ke._jsonSchema={type:J("string",Ke._jsonSchemaVersion),latitude:J("number"),longitude:J("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class he{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}he.UNAUTHENTICATED=new he(null),he.GOOGLE_CREDENTIALS=new he("google-credentials-uid"),he.FIRST_PARTY=new he("first-party-uid"),he.MOCK_USER=new he("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le{constructor(){this.promise=new Promise(((e,t)=>{this.resolve=e,this.reject=t}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qd{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class $d{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable((()=>t(he.UNAUTHENTICATED)))}shutdown(){}}class zd{constructor(e){this.De=e,this.currentUser=he.UNAUTHENTICATED,this.xe=0,this.forceRefresh=!1,this.auth=null}start(e,t){E(this.Ce===void 0,42304);let n=this.xe;const s=u=>this.xe!==n?(n=this.xe,t(u)):Promise.resolve();let i=new Le;this.Ce=()=>{this.xe++,this.currentUser=this.Fe(),i.resolve(),i=new Le,e.enqueueRetryable((()=>s(this.currentUser)))};const a=()=>{const u=i;e.enqueueRetryable((async()=>{await u.promise,await s(this.currentUser)}))},o=u=>{T("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.Ce&&(this.auth.addAuthTokenListener(this.Ce),a())};this.De.onInit((u=>o(u))),setTimeout((()=>{if(!this.auth){const u=this.De.getImmediate({optional:!0});u?o(u):(T("FirebaseAuthCredentialsProvider","Auth not yet detected"),i.resolve(),i=new Le)}}),0),a()}getToken(){const e=this.xe,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then((n=>this.xe!==e?(T("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(E(typeof n.accessToken=="string",31837,{Oe:n}),new qd(n.accessToken,this.currentUser)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.Ce&&this.auth.removeAuthTokenListener(this.Ce),this.Ce=void 0}Fe(){const e=this.auth&&this.auth.getUid();return E(e===null||typeof e=="string",2055,{Me:e}),new he(e)}}class Gd{constructor(e,t,n){this.Ne=e,this.Le=t,this.Be=n,this.type="FirstParty",this.user=he.FIRST_PARTY,this.Ue=new Map}ke(){return this.Be?this.Be():null}get headers(){this.Ue.set("X-Goog-AuthUser",this.Ne);const e=this.ke();return e&&this.Ue.set("Authorization",e),this.Le&&this.Ue.set("X-Goog-Iam-Authorization-Token",this.Le),this.Ue}}class Kd{constructor(e,t,n){this.Ne=e,this.Le=t,this.Be=n}getToken(){return Promise.resolve(new Gd(this.Ne,this.Le,this.Be))}start(e,t){e.enqueueRetryable((()=>t(he.FIRST_PARTY)))}shutdown(){}invalidateToken(){}}class Yo{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class Qd{constructor(e,t){this.qe=t,this.forceRefresh=!1,this.appCheck=null,this.$e=null,this.Ke=null,Ah(e)&&e.settings.appCheckToken&&(this.Ke=e.settings.appCheckToken)}start(e,t){E(this.Ce===void 0,3512);const n=i=>{i.error!=null&&T("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${i.error.message}`);const a=i.token!==this.$e;return this.$e=i.token,T("FirebaseAppCheckTokenProvider",`Received ${a?"new":"existing"} token.`),a?t(i.token):Promise.resolve()};this.Ce=i=>{e.enqueueRetryable((()=>n(i)))};const s=i=>{T("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=i,this.Ce&&this.appCheck.addTokenListener(this.Ce)};this.qe.onInit((i=>s(i))),setTimeout((()=>{if(!this.appCheck){const i=this.qe.getImmediate({optional:!0});i?s(i):T("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}}),0)}getToken(){if(this.Ke)return Promise.resolve(new Yo(this.Ke));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then((t=>t?(E(typeof t.token=="string",44558,{tokenResult:t}),this.$e=t.token,new Yo(t.token)):null)):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.Ce&&this.appCheck.removeTokenListener(this.Ce),this.Ce=void 0}}function jc(r){const e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jd{Qe(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jo="ConnectivityMonitor";class Xo{constructor(){this.We=()=>this.Ge(),this.ze=()=>this.je(),this.He=[],this.Je()}Qe(e){this.He.push(e)}shutdown(){window.removeEventListener("online",this.We),window.removeEventListener("offline",this.ze)}Je(){window.addEventListener("online",this.We),window.addEventListener("offline",this.ze)}Ge(){T(Jo,"Network connectivity changed: AVAILABLE");for(const e of this.He)e(0)}je(){T(Jo,"Network connectivity changed: UNAVAILABLE");for(const e of this.He)e(1)}static Ye(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ts=null;function Mi(){return ts===null?ts=(function(){return 268435456+Math.round(2147483648*Math.random())})():ts++,"0x"+ts.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pi="RestConnection",Wd={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class Hd{get Ze(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),s=encodeURIComponent(this.databaseId.database);this.Xe=t+"://"+e.host,this.et=`projects/${n}/databases/${s}`,this.tt=this.databaseId.database===Ts?`project_id=${n}`:`project_id=${n}&database_id=${s}`}nt(e,t,n,s,i){const a=Mi(),o=this.rt(e,t.toUriEncodedString());T(pi,`Sending RPC '${e}' ${a}:`,o,n);const u={"google-cloud-resource-prefix":this.et,"x-goog-request-params":this.tt};this.it(u,s,i);const{host:c}=new URL(o),l=Qu(c);return this.st(e,o,u,n,l).then((h=>(T(pi,`Received RPC '${e}' ${a}: `,h),h)),(h=>{throw Oe(pi,`RPC '${e}' ${a} failed with error: `,h,"url: ",o,"request:",n),h}))}_t(e,t,n,s,i,a){return this.nt(e,t,n,s,i)}it(e,t,n){if(e["X-Goog-Api-Client"]=(function(){return"gl-js/ fire/"+zn})(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach(((s,i)=>e[i]=s)),n&&n.headers.forEach(((s,i)=>e[i]=s)),this.databaseInfo._customHeaders)for(const s of Object.keys(this.databaseInfo._customHeaders))e[s]=this.databaseInfo._customHeaders[s]}rt(e,t){const n=Wd[e];let s=`${this.Xe}/v1/${t}:${n}`;return this.databaseInfo.apiKey&&(s=`${s}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),s}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yd{constructor(e){this.ot=e.ot,this.ut=e.ut}ct(e){this.lt=e}Et(e){this.ht=e}Tt(e){this.Pt=e}onMessage(e){this.It=e}close(){this.ut()}send(e){this.ot(e)}Rt(){this.lt()}At(){this.ht()}Vt(e){this.Pt(e)}dt(e){this.It(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const le="WebChannelConnection",er=(r,e,t)=>{r.listen(e,(n=>{try{t(n)}catch(s){setTimeout((()=>{throw s}),0)}}))};class An extends Hd{constructor(e){super(e),this.ft=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static gt(){if(!An.yt){const e=Nh();er(e,kh.STAT_EVENT,(t=>{t.stat===Ro.PROXY?T(le,"STAT_EVENT: detected buffering proxy"):t.stat===Ro.NOPROXY&&T(le,"STAT_EVENT: detected no buffering proxy")})),An.yt=!0}}st(e,t,n,s,i){const a=Mi();return new Promise(((o,u)=>{const c=new Lh;c.setWithCredentials(!0),c.listenOnce(Oh.COMPLETE,(()=>{try{switch(c.getLastErrorCode()){case mi.NO_ERROR:const h=c.getResponseJson();T(le,`XHR for RPC '${e}' ${a} received:`,JSON.stringify(h)),o(h);break;case mi.TIMEOUT:T(le,`RPC '${e}' ${a} timed out`),u(new I(p.DEADLINE_EXCEEDED,"Request time out"));break;case mi.HTTP_ERROR:const d=c.getStatus();if(T(le,`RPC '${e}' ${a} failed with status:`,d,"response text:",c.getResponseText()),d>0){let _=c.getResponseJson();Array.isArray(_)&&(_=_[0]);const y=_==null?void 0:_.error;if(y&&y.status&&y.message){const v=(function(N){const k=N.toLowerCase().replace(/_/g,"-");return Object.values(p).indexOf(k)>=0?k:p.UNKNOWN})(y.status);u(new I(v,y.message))}else u(new I(p.UNKNOWN,"Server responded with status "+c.getStatus()))}else u(new I(p.UNAVAILABLE,"Connection failed."));break;default:V(9055,{wt:e,streamId:a,bt:c.getLastErrorCode(),St:c.getLastError()})}}finally{T(le,`RPC '${e}' ${a} completed.`)}}));const l=JSON.stringify(s);T(le,`RPC '${e}' ${a} sending request:`,s),c.send(t,"POST",l,n,15)}))}vt(e,t,n){const s=Mi(),i=[this.Xe,"/","google.firestore.v1.Firestore","/",e,"/channel"],a=this.createWebChannelTransport(),o={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;u!==void 0&&(o.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(o.useFetchStreams=!0),this.it(o.initMessageHeaders,t,n),o.encodeInitMessageHeaders=!0;const c=i.join("");T(le,`Creating RPC '${e}' stream ${s}: ${c}`,o);const l=a.createWebChannel(c,o);this.Dt(l);let h=!1,d=!1;const _=new Yd({ot:y=>{d?T(le,`Not sending because RPC '${e}' stream ${s} is closed:`,y):(h||(T(le,`Opening RPC '${e}' stream ${s} transport.`),l.open(),h=!0),T(le,`RPC '${e}' stream ${s} sending:`,y),l.send(y))},ut:()=>l.close()});return er(l,Xr.EventType.OPEN,(()=>{d||(T(le,`RPC '${e}' stream ${s} transport opened.`),_.Rt())})),er(l,Xr.EventType.CLOSE,(()=>{d||(d=!0,T(le,`RPC '${e}' stream ${s} transport closed`),_.Vt(),this.xt(l))})),er(l,Xr.EventType.ERROR,(y=>{d||(d=!0,Oe(le,`RPC '${e}' stream ${s} transport errored. Name:`,y.name,"Message:",y.message),_.Vt(new I(p.UNAVAILABLE,"The operation could not be completed")))})),er(l,Xr.EventType.MESSAGE,(y=>{var v;if(!d){const R=y.data[0];E(!!R,16349);const N=R,k=(N==null?void 0:N.error)||((v=N[0])==null?void 0:v.error);if(k){T(le,`RPC '${e}' stream ${s} received error:`,k);const L=k.status;let re=(function(ge){const ut=Y[ge];if(ut!==void 0)return Pc(ut)})(L),G=k.message;L==="NOT_FOUND"&&G.includes("database")&&G.includes("does not exist")&&G.includes(this.databaseId.database)&&Oe(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),re===void 0&&(re=p.INTERNAL,G="Unknown error status: "+L+" with message "+k.message),d=!0,_.Vt(new I(re,G)),l.close()}else T(le,`RPC '${e}' stream ${s} received:`,R),_.dt(R)}})),An.gt(),setTimeout((()=>{_.At()}),0),_}terminate(){this.ft.forEach((e=>e.close())),this.ft=[]}Dt(e){this.ft.push(e)}xt(e){this.ft=this.ft.filter((t=>t===e))}it(e,t,n){super.it(e,t,n),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return Mh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jd(r){return new An(r)}An.yt=!1;class Ia{constructor(e,t,n=1e3,s=1.5,i=6e4){this.Ct=e,this.timerId=t,this.Ft=n,this.Ot=s,this.Mt=i,this.Nt=0,this.Lt=null,this.Bt=Date.now(),this.reset()}reset(){this.Nt=0}Ut(){this.Nt=this.Mt}kt(e){this.cancel();const t=Math.floor(this.Nt+this.qt()),n=Math.max(0,Date.now()-this.Bt),s=Math.max(0,t-n);s>0&&T("ExponentialBackoff",`Backing off for ${s} ms (base delay: ${this.Nt} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.Lt=this.Ct.enqueueAfterDelay(this.timerId,s,(()=>(this.Bt=Date.now(),e()))),this.Nt*=this.Ot,this.Nt<this.Ft&&(this.Nt=this.Ft),this.Nt>this.Mt&&(this.Nt=this.Mt)}$t(){this.Lt!==null&&(this.Lt.skipDelay(),this.Lt=null)}cancel(){this.Lt!==null&&(this.Lt.cancel(),this.Lt=null)}qt(){return(Math.random()-.5)*this.Nt}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zo="PersistentStream";class Wc{constructor(e,t,n,s,i,a,o,u){this.Ct=e,this.Kt=n,this.Qt=s,this.connection=i,this.authCredentialsProvider=a,this.appCheckCredentialsProvider=o,this.listener=u,this.state=0,this.Wt=0,this.Gt=null,this.zt=null,this.stream=null,this.jt=0,this.Ht=new Ia(e,t)}Jt(){return this.state===1||this.state===5||this.Yt()}Yt(){return this.state===2||this.state===3}start(){this.jt=0,this.state!==4?this.auth():this.Zt()}async stop(){this.Jt()&&await this.close(0)}Xt(){this.state=0,this.Ht.reset()}en(){this.Yt()&&this.Gt===null&&(this.Gt=this.Ct.enqueueAfterDelay(this.Kt,6e4,(()=>this.tn())))}nn(e){this.rn(),this.stream.send(e)}async tn(){if(this.Yt())return this.close(0)}rn(){this.Gt&&(this.Gt.cancel(),this.Gt=null)}sn(){this.zt&&(this.zt.cancel(),this.zt=null)}async close(e,t){this.rn(),this.sn(),this.Ht.cancel(),this.Wt++,e!==4?this.Ht.reset():t&&t.code===p.RESOURCE_EXHAUSTED?(H(t.toString()),H("Using maximum backoff delay to prevent overloading the backend."),this.Ht.Ut()):t&&t.code===p.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this._n(),this.stream.close(),this.stream=null),this.state=e,await this.listener.Tt(t)}_n(){}auth(){this.state=1;const e=this.an(this.Wt),t=this.Wt;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then((([n,s])=>{this.Wt===t&&this.un(n,s)}),(n=>{e((()=>{const s=new I(p.UNKNOWN,"Fetching auth token failed: "+n.message);return this.cn(s)}))}))}un(e,t){const n=this.an(this.Wt);this.stream=this.En(e,t),this.stream.ct((()=>{n((()=>this.listener.ct()))})),this.stream.Et((()=>{n((()=>(this.state=2,this.zt=this.Ct.enqueueAfterDelay(this.Qt,1e4,(()=>(this.Yt()&&(this.state=3),Promise.resolve()))),this.listener.Et())))})),this.stream.Tt((s=>{n((()=>this.cn(s)))})),this.stream.onMessage((s=>{n((()=>++this.jt==1?this.hn(s):this.onNext(s)))}))}Zt(){this.state=5,this.Ht.kt((async()=>{this.state=0,this.start()}))}cn(e){return T(Zo,`close with error: ${e}`),this.stream=null,this.close(4,e)}an(e){return t=>{this.Ct.enqueueAndForget((()=>this.Wt===e?t():(T(Zo,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve())))}}}class Xd extends Wc{constructor(e,t,n,s,i,a){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,s,a),this.serializer=i}En(e,t){return this.connection.vt("Listen",e,t)}hn(e){return this.onNext(e)}onNext(e){this.Ht.reset();const t=Nd(this.serializer,e),n=(function(i){if(!("targetChange"in i))return b.min();const a=i.targetChange;return a.targetIds&&a.targetIds.length?b.min():a.readTime?oe(a.readTime):b.min()})(e);return this.listener.Tn(t,n)}Pn(e){const t={};t.database=Li(this.serializer),t.addTarget=(function(i,a){let o;const u=a.target;if(o=Je(u)?{pipelineQuery:qc(i,u)}:da(u)?{documents:Fc(i,u)}:{query:Uc(i,u).Se},o.targetId=a.targetId,a.resumeToken.approximateByteSize()>0){o.resumeToken=Nc(i,a.resumeToken);const c=Ni(i,a.expectedCount);c!==null&&(o.expectedCount=c)}else if(a.snapshotVersion.compareTo(b.min())>0){o.readTime=Kt(i,a.snapshotVersion.toTimestamp());const c=Ni(i,a.expectedCount);c!==null&&(o.expectedCount=c)}return o})(this.serializer,e);const n=Ld(this.serializer,e);n&&(t.labels=n),this.nn(t)}In(e){const t={};t.database=Li(this.serializer),t.removeTarget=e,this.nn(t)}}class Zd extends Wc{constructor(e,t,n,s,i,a){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,s,a),this.serializer=i}get Rn(){return this.jt>0}start(){this.lastStreamToken=void 0,super.start()}_n(){this.Rn&&this.An([])}En(e,t){return this.connection.vt("Write",e,t)}hn(e){return E(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,E(!e.writeResults||e.writeResults.length===0,55816),this.listener.Vn()}onNext(e){E(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.Ht.reset();const t=kd(e.writeResults,e.commitTime),n=oe(e.commitTime);return this.listener.dn(n,t)}fn(){const e={};e.database=Li(this.serializer),this.nn(e)}An(e){const t={streamToken:this.lastStreamToken,writes:e.map((n=>Vr(this.serializer,n)))};this.nn(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ef{}class tf extends ef{constructor(e,t,n,s){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=s,this.mn=!1}pn(){if(this.mn)throw new I(p.FAILED_PRECONDITION,"The client has already been terminated.")}nt(e,t,n,s){return this.pn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([i,a])=>this.connection.nt(e,ki(t,n),s,i,a))).catch((i=>{throw i.name==="FirebaseError"?(i.code===p.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),i):new I(p.UNKNOWN,i.toString())}))}_t(e,t,n,s,i){return this.pn(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then((([a,o])=>this.connection._t(e,ki(t,n),s,a,o,i))).catch((a=>{throw a.name==="FirebaseError"?(a.code===p.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),a):new I(p.UNKNOWN,a.toString())}))}terminate(){this.mn=!0,this.connection.terminate()}}function nf(r,e,t,n){return new tf(r,e,t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rf="ComponentProvider",eu=new Map;function sf(r,e,t,n,s){return new Wh(r,e,t,s.host,s.ssl,s.experimentalForceLongPolling,s.experimentalAutoDetectLongPolling,jc(s.experimentalLongPollingOptions),s.useFetchStreams,s.isUsingEmulator,n,s._customHeaders,s.grpcFlowControlWindow)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tu={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Hc=41943040;class de{static withCacheSize(e){return new de(e,de.DEFAULT_COLLECTION_PERCENTILE,de.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}de.DEFAULT_COLLECTION_PERCENTILE=10,de.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,de.DEFAULT=new de(Hc,de.DEFAULT_COLLECTION_PERCENTILE,de.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),de.DISABLED=new de(-1,0,0);/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Te{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.gn(n),this.yn=n=>t.writeSequenceNumber(n))}gn(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.yn&&this.yn(e),e}}Te.wn=-1;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yc="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Jc{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach((e=>e()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function St(r){if(r.code!==p.FAILED_PRECONDITION||r.message!==Yc)throw r;T("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class m{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e((t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)}),(t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)}))}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&V(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new m(((n,s)=>{this.nextCallback=i=>{this.wrapSuccess(e,i).next(n,s)},this.catchCallback=i=>{this.wrapFailure(t,i).next(n,s)}}))}toPromise(){return new Promise(((e,t)=>{this.next(e,t)}))}wrapUserFunction(e){try{const t=e();return t instanceof m?t:m.resolve(t)}catch(t){return m.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction((()=>e(t))):m.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction((()=>e(t))):m.reject(t)}static resolve(e){return new m(((t,n)=>{t(e)}))}static reject(e){return new m(((t,n)=>{n(e)}))}static waitFor(e){return new m(((t,n)=>{let s=0,i=0,a=!1;e.forEach((o=>{++s,o.next((()=>{++i,a&&i===s&&t()}),(u=>n(u)))})),a=!0,i===s&&t()}))}static or(e){let t=m.resolve(!1);for(const n of e)t=t.next((s=>s?m.resolve(s):n()));return t}static forEach(e,t){const n=[];return e.forEach(((s,i)=>{n.push(t.call(this,s,i))})),this.waitFor(n)}static mapArray(e,t){return new m(((n,s)=>{const i=e.length,a=new Array(i);let o=0;for(let u=0;u<i;u++){const c=u;t(e[c]).next((l=>{a[c]=l,++o,o===i&&n(a)}),(l=>s(l)))}}))}static doWhile(e,t){return new m(((n,s)=>{const i=()=>{e()===!0?t().next((()=>{i()}),s):n()};i()}))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Re="SimpleDb";class Ws{static open(e,t,n,s){try{return new Ws(t,e.transaction(s,n))}catch(i){throw new dr(t,i)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.bn=new Le,this.transaction.oncomplete=()=>{this.bn.resolve()},this.transaction.onabort=()=>{t.error?this.bn.reject(new dr(e,t.error)):this.bn.resolve()},this.transaction.onerror=n=>{const s=Ta(n.target.error);this.bn.reject(new dr(e,s))}}get Sn(){return this.bn.promise}abort(e){e&&this.bn.reject(e),this.aborted||(T(Re,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}vn(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new of(t)}}class pt{static delete(e){return T(Re,"Removing database:",e),Ot(bh().indexedDB.deleteDatabase(e)).toPromise()}static Ye(){if(!xh())return!1;if(pt.Dn())return!0;const e=ys(),t=pt.xn(e),n=0<t&&t<10,s=Xc(e),i=0<s&&s<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||n||i)}static Dn(){var e;return typeof process<"u"&&((e=process.__PRIVATE_env)==null?void 0:e.__PRIVATE_USE_MOCK_PERSISTENCE)==="YES"}static Cn(e,t){return e.store(t)}static xn(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(n)}constructor(e,t,n){this.name=e,this.version=t,this.Fn=n,this.On=null,pt.xn(ys())===12.2&&H("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async Mn(e){return this.db||(T(Re,"Opening database:",this.name),this.db=await new Promise(((t,n)=>{const s=indexedDB.open(this.name,this.version);s.onsuccess=i=>{const a=i.target.result;t(a)},s.onblocked=()=>{n(new dr(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},s.onerror=i=>{const a=i.target.error;a.name==="VersionError"?n(new I(p.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):a.name==="InvalidStateError"?n(new I(p.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+a)):n(new dr(e,a))},s.onupgradeneeded=i=>{T(Re,'Database "'+this.name+'" requires upgrade from version:',i.oldVersion);const a=i.target.result;this.Fn.Nn(a,s.transaction,i.oldVersion,this.version).next((()=>{T(Re,"Database upgrade to version "+this.version+" complete")}))}}))),this.Ln&&(this.db.onversionchange=t=>this.Ln(t)),this.db}Bn(e){this.Ln=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,n,s){const i=t==="readonly";let a=0;for(;;){++a;try{this.db=await this.Mn(e);const o=Ws.open(this.db,e,i?"readonly":"readwrite",n),u=s(o).next((c=>(o.vn(),c))).catch((c=>(o.abort(c),m.reject(c)))).toPromise();return u.catch((()=>{})),await o.Sn,u}catch(o){const u=o,c=u.name!=="FirebaseError"&&a<3;if(T(Re,"Transaction failed with error:",u.message,"Retrying:",c),this.close(),!c)return Promise.reject(u)}}}close(){this.db&&this.db.close(),this.db=void 0}}function Xc(r){const e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class af{constructor(e){this.Un=e,this.kn=!1,this.qn=null}get isDone(){return this.kn}get $n(){return this.qn}set cursor(e){this.Un=e}done(){this.kn=!0}Kn(e){this.qn=e}delete(){return Ot(this.Un.delete())}}class dr extends I{constructor(e,t){super(p.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function Ct(r){return r.name==="IndexedDbTransactionError"}class of{constructor(e){this.store=e}put(e,t){let n;return t!==void 0?(T(Re,"PUT",this.store.name,e,t),n=this.store.put(t,e)):(T(Re,"PUT",this.store.name,"<auto-key>",e),n=this.store.put(e)),Ot(n)}add(e){return T(Re,"ADD",this.store.name,e,e),Ot(this.store.add(e))}get(e){return Ot(this.store.get(e)).next((t=>(t===void 0&&(t=null),T(Re,"GET",this.store.name,e,t),t)))}delete(e){return T(Re,"DELETE",this.store.name,e),Ot(this.store.delete(e))}count(){return T(Re,"COUNT",this.store.name),Ot(this.store.count())}Qn(e,t){const n=this.options(e,t),s=n.index?this.store.index(n.index):this.store;if(typeof s.getAll=="function"){const i=s.getAll(n.range);return new m(((a,o)=>{i.onerror=u=>{o(u.target.error)},i.onsuccess=u=>{a(u.target.result)}}))}{const i=this.cursor(n),a=[];return this.Wn(i,((o,u)=>{a.push(u)})).next((()=>a))}}Gn(e,t){const n=this.store.getAll(e,t===null?void 0:t);return new m(((s,i)=>{n.onerror=a=>{i(a.target.error)},n.onsuccess=a=>{s(a.target.result)}}))}zn(e,t){T(Re,"DELETE ALL",this.store.name);const n=this.options(e,t);n.jn=!1;const s=this.cursor(n);return this.Wn(s,((i,a,o)=>o.delete()))}Hn(e,t){let n;t?n=e:(n={},t=e);const s=this.cursor(n);return this.Wn(s,t)}Jn(e){const t=this.cursor({});return new m(((n,s)=>{t.onerror=i=>{const a=Ta(i.target.error);s(a)},t.onsuccess=i=>{const a=i.target.result;a?e(a.primaryKey,a.value).next((o=>{o?a.continue():n()})):n()}}))}Wn(e,t){const n=[];return new m(((s,i)=>{e.onerror=a=>{i(a.target.error)},e.onsuccess=a=>{const o=a.target.result;if(!o)return void s();const u=new af(o),c=t(o.primaryKey,o.value,u);if(c instanceof m){const l=c.catch((h=>(u.done(),m.reject(h))));n.push(l)}u.isDone?s():u.$n===null?o.continue():o.continue(u.$n)}})).next((()=>m.waitFor(n)))}options(e,t){let n;return e!==void 0&&(typeof e=="string"?n=e:t=e),{index:n,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const n=this.store.index(e.index);return e.jn?n.openKeyCursor(e.range,t):n.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function Ot(r){return new m(((e,t)=>{r.onsuccess=n=>{const s=n.target.result;e(s)},r.onerror=n=>{const s=Ta(n.target.error);t(s)}}))}let nu=!1;function Ta(r){const e=pt.xn(ys());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(r.message.indexOf(t)>=0){const n=new I("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return nu||(nu=!0,setTimeout((()=>{throw n}),0)),n}}return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ru="LruGarbageCollector",Zc=1048576;function su([r,e],[t,n]){const s=S(r,t);return s===0?S(e,n):s}class uf{constructor(e){this.Yn=e,this.buffer=new U(su),this.Zn=0}Xn(){return++this.Zn}er(e){const t=[e,this.Xn()];if(this.buffer.size<this.Yn)this.buffer=this.buffer.add(t);else{const n=this.buffer.last();su(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}}class el{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.tr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.nr(6e4)}stop(){this.tr&&(this.tr.cancel(),this.tr=null)}get started(){return this.tr!==null}nr(e){T(ru,`Garbage collection scheduled in ${e}ms`),this.tr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,(async()=>{this.tr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){Ct(t)?T(ru,"Ignoring IndexedDB error during garbage collection: ",t):await St(t)}await this.nr(3e5)}))}}class cf{constructor(e,t){this.rr=e,this.params=t}calculateTargetCount(e,t){return this.rr.ir(e).next((n=>Math.floor(t/100*n)))}nthSequenceNumber(e,t){if(t===0)return m.resolve(Te.wn);const n=new uf(t);return this.rr.forEachTarget(e,(s=>n.er(s.sequenceNumber))).next((()=>this.rr.sr(e,(s=>n.er(s))))).next((()=>n.maxValue))}removeTargets(e,t,n){return this.rr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.rr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(T("LruGarbageCollector","Garbage collection skipped; disabled"),m.resolve(tu)):this.getCacheSize(e).next((n=>n<this.params.cacheSizeCollectionThreshold?(T("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),tu):this._r(e,t)))}getCacheSize(e){return this.rr.getCacheSize(e)}_r(e,t){let n,s,i,a,o,u,c;const l=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next((h=>(h>this.params.maximumSequenceNumbersToCollect?(T("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${h}`),s=this.params.maximumSequenceNumbersToCollect):s=h,a=Date.now(),this.nthSequenceNumber(e,s)))).next((h=>(n=h,o=Date.now(),this.removeTargets(e,n,t)))).next((h=>(i=h,u=Date.now(),this.removeOrphanedDocuments(e,n)))).next((h=>(c=Date.now(),pn()<=Ye.DEBUG&&T("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${a-l}ms
	Determined least recently used ${s} in `+(o-a)+`ms
	Removed ${i} targets in `+(u-o)+`ms
	Removed ${h} documents in `+(c-u)+`ms
Total Duration: ${c-l}ms`),m.resolve({didRun:!0,sequenceNumbersCollected:s,targetsRemoved:i,documentsRemoved:h}))))}}function tl(r,e){return new cf(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lf="firestore.googleapis.com",iu=!0;class au{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new I(p.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=lf,this.ssl=iu}else this.host=e.host,this.ssl=e.ssl??iu;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e._customHeaders&&(this._customHeaders={...e._customHeaders}),e.cacheSizeBytes===void 0)this.cacheSizeBytes=Hc;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Zc)throw new I(p.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}if(Kh("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=jc(e.experimentalLongPollingOptions??{}),(function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new I(p.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new I(p.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new I(p.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}})(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams,e.grpcFlowControlWindow!==void 0){if(typeof e.grpcFlowControlWindow!="number"||e.grpcFlowControlWindow<=0||e.grpcFlowControlWindow>2147483647||!Number.isInteger(e.grpcFlowControlWindow))throw new I(p.INVALID_ARGUMENT,"grpcFlowControlWindow must be a positive integer and cannot exceed 2147483647");this.grpcFlowControlWindow=e.grpcFlowControlWindow}}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(function(n,s){return n.timeoutSeconds===s.timeoutSeconds})(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams&&this.grpcFlowControlWindow===e.grpcFlowControlWindow&&(function(n,s){if(n===s)return!0;if(!n||!s)return!1;const i=Object.keys(n),a=Object.keys(s);if(i.length!==a.length)return!1;for(const o of i)if(n[o]!==s[o])return!1;return!0})(this._customHeaders,e._customHeaders)}}let Ea=class{constructor(e,t,n,s){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=s,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new au({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new I(p.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new I(p.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new au(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=(function(n){if(!n)return new $d;switch(n.type){case"firstParty":return new Kd(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new I(p.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}})(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return(function(t){const n=eu.get(t);n&&(T(rf,"Removing Datastore"),eu.delete(t),n.terminate())})(this),Promise.resolve()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class He{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new He(this.firestore,e,this._query)}}class z{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new gt(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new z(this.firestore,e,this._key)}toJSON(){return{type:z._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(Fr(t,z._jsonSchema))return new z(e,n||null,new A(D.fromString(t.referencePath)))}}z._jsonSchemaVersion="firestore/documentReference/1.0",z._jsonSchema={type:J("string",z._jsonSchemaVersion),referencePath:J("string")};class gt extends He{constructor(e,t,n){super(e,t,zr(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new z(this.firestore,null,new A(e))}withConverter(e){return new gt(this.firestore,e,this._path)}}function cg(r,e,...t){if(r=we(r),Xu("collection","path",e),r instanceof Ea){const n=D.fromString(e,...t);return xo(n),new gt(r,null,n)}{if(!(r instanceof z||r instanceof gt))throw new I(p.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(D.fromString(e,...t));return xo(n),new gt(r.firestore,null,n)}}function lg(r,e,...t){if(r=we(r),arguments.length===1&&(e=na.newId()),Xu("doc","path",e),r instanceof Ea){const n=D.fromString(e,...t);return bo(n),new z(r,null,new A(n))}{if(!(r instanceof z||r instanceof gt))throw new I(p.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(D.fromString(e,...t));return bo(n),new z(r.firestore,r instanceof gt?r.converter:null,new A(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ee{constructor(e){this._values=(e||[]).map((t=>t))}toArray(){return this._values.map((e=>e))}isEqual(e){return(function(n,s){if(n.length!==s.length)return!1;for(let i=0;i<n.length;++i)if(n[i]!==s[i])return!1;return!0})(this._values,e._values)}toJSON(){return{type:Ee._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Fr(e,Ee._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every((t=>typeof t=="number")))return new Ee(e.vectorValues);throw new I(p.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}Ee._jsonSchemaVersion="firestore/vectorValue/1.0",Ee._jsonSchema={type:J("string",Ee._jsonSchemaVersion),vectorValues:J("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hf=/^__.*__$/;class df{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new at(e,this.data,this.fieldMask,t,this.fieldTransforms):new Gn(e,this.data,t,this.fieldTransforms)}}class nl{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new at(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function rl(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw V(40011,{dataSource:r})}}class wa{constructor(e,t,n,s,i,a){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=s,i===void 0&&this.validatePath(),this.fieldTransforms=i||[],this.fieldMask=a||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}contextWith(e){return new wa({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}childContextForField(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePathSegment(e),n}childContextForFieldPath(e){var s;const t=(s=this.path)==null?void 0:s.child(e),n=this.contextWith({path:t,arrayElement:!1});return n.validatePath(),n}childContextForArray(e){return this.contextWith({path:void 0,arrayElement:!0})}createError(e){return Rs(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find((t=>e.isPrefixOf(t)))!==void 0||this.fieldTransforms.find((t=>e.isPrefixOf(t.field)))!==void 0}validatePath(){if(this.path)for(let e=0;e<this.path.length;e++)this.validatePathSegment(this.path.get(e))}validatePathSegment(e){if(e.length===0)throw this.createError("Document fields must not be empty");if(rl(this.dataSource)&&hf.test(e))throw this.createError('Document fields cannot begin and end with "__"')}}class ff{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||Qs(e)}createContext(e,t,n,s=!1){return new wa({dataSource:e,methodName:t,targetDoc:n,path:te.emptyPath(),arrayElement:!1,hasConverter:s},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function jn(r){const e=r._freezeSettings(),t=Qs(r._databaseId);return new ff(r._databaseId,!!e.ignoreUndefinedProperties,t)}function Aa(r,e,t,n,s,i={}){const a=r.createContext(i.merge||i.mergeFields?2:0,e,t,s);Pa("Data must be an object, but it was:",a,n);const o=il(n,a);let u,c;if(i.merge)u=new Ie(a.fieldMask),c=a.fieldTransforms;else if(i.mergeFields){const l=[];for(const h of i.mergeFields){const d=rt(e,h,t);if(!a.contains(d))throw new I(p.INVALID_ARGUMENT,`Field '${d}' is specified in your field mask but missing from your input data.`);cl(l,d)||l.push(d)}u=new Ie(l),c=a.fieldTransforms.filter((h=>u.covers(h.field)))}else u=null,c=a.fieldTransforms;return new df(new ie(o),u,c)}class Hs extends js{_toFieldTransform(e){if(e.dataSource!==2)throw e.dataSource===1?e.createError(`${this._methodName}() can only appear at the top level of your update data`):e.createError(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Hs}}class Va extends js{_toFieldTransform(e){return new fc(e.path,new bn)}isEqual(e){return e instanceof Va}}function va(r,e,t,n){const s=r.createContext(1,e,t);Pa("Data must be an object, but it was:",s,n);const i=[],a=ie.empty();xt(n,((u,c)=>{const l=ul(e,u,t);c=we(c);const h=s.childContextForFieldPath(l);if(c instanceof Hs)i.push(l);else{const d=At(c,h);d!=null&&(i.push(l),a.set(l,d))}}));const o=new Ie(i);return new nl(a,o,s.fieldTransforms)}function Ra(r,e,t,n,s,i){const a=r.createContext(1,e,t),o=[rt(e,n,t)],u=[s];if(i.length%2!=0)throw new I(p.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let d=0;d<i.length;d+=2)o.push(rt(e,i[d])),u.push(i[d+1]);const c=[],l=ie.empty();for(let d=o.length-1;d>=0;--d)if(!cl(c,o[d])){const _=o[d];let y=u[d];y=we(y);const v=a.childContextForFieldPath(_);if(y instanceof Hs)c.push(_);else{const R=At(y,v);R!=null&&(c.push(_),l.set(_,R))}}const h=new Ie(c);return new nl(l,h,a.fieldTransforms)}function sl(r,e,t,n=!1){return At(t,r.createContext(n?4:3,e))}function At(r,e,t){if(ol(r=we(r)))return Pa("Unsupported field value:",e,r),il(r,e);if(r instanceof js)return(function(s,i){if(!rl(i.dataSource))throw i.createError(`${s._methodName}() can only be used with update() and set()`);if(!i.path)throw i.createError(`${s._methodName}() is not currently supported inside arrays`);const a=s._toFieldTransform(i);a&&i.fieldTransforms.push(a)})(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.createError("Nested arrays are not supported");return(function(s,i){const a=[];let o=0;for(const u of s){let c=At(u,i.childContextForArray(o));c==null&&(c={nullValue:"NULL_VALUE"}),a.push(c),o++}return{arrayValue:{values:a}}})(r,e)}return(function(s,i,a){if((s=we(s))===null)return{nullValue:"NULL_VALUE"};if(typeof s=="number")return aa(i.serializer,s);if(typeof s=="boolean")return{booleanValue:s};if(typeof s=="string")return{stringValue:s};if(s instanceof Date){const o=F.fromDate(s);return{timestampValue:Kt(i.serializer,o)}}if(s instanceof F){const o=new F(s.seconds,1e3*Math.floor(s.nanoseconds/1e3));return{timestampValue:Kt(i.serializer,o)}}if(al(s)){const o=F.fromInstant(s),u=new F(o.seconds,1e3*Math.floor(o.nanoseconds/1e3));return{timestampValue:Kt(i.serializer,u)}}if(s instanceof Ke)return{geoPointValue:{latitude:s.latitude,longitude:s.longitude}};if(s instanceof Pe)return{bytesValue:Nc(i.serializer,s._byteString)};if(s instanceof z){const o=i.databaseId,u=s.firestore._databaseId;if(!u.isEqual(o))throw i.createError(`Document reference is for database ${u.projectId}/${u.database} but should be for database ${o.projectId}/${o.database}`);return{referenceValue:ya(s.firestore._databaseId||i.databaseId,s._key.path)}}if(s instanceof Ee)return(function(u,c){const l=u instanceof Ee?u.toArray():u;return{mapValue:{fields:{[ra]:{stringValue:sa},[Jt]:{arrayValue:{values:l.map((d=>{if(typeof d!="number")throw c.createError("VectorValues must only contain numeric values.");return $s(c.serializer,d)}))}}}}}})(s,i);if(Kc(s))return s._toProto(i.serializer);throw i.createError(`Unsupported field value: ${qs(s)}`)})(r,e)}function il(r,e){const t={};return Ju(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):xt(r,((n,s)=>{const i=At(s,e.childContextForField(n));i!=null&&(t[n]=i)})),{mapValue:{fields:t}}}function al(r){if(typeof r!="object"||r===null)return!1;if(typeof Temporal<"u"&&typeof Temporal.Instant=="function"&&r instanceof Temporal.Instant)return!0;const e=r;return e[Symbol.toStringTag]==="Temporal.Instant"&&typeof e.t=="bigint"}function ol(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof F||r instanceof Ke||r instanceof Pe||r instanceof z||r instanceof js||r instanceof Ee||al(r)||Kc(r))}function Pa(r,e,t){if(!ol(t)||!Mr(t)){const n=qs(t);throw n==="an object"?e.createError(r+" a custom object"):e.createError(r+" "+n)}}function rt(r,e,t){if((e=we(e))instanceof Qn)return e._internalPath;if(typeof e=="string")return ul(r,e);throw Rs("Field path arguments must be of type string or ",r,!1,void 0,t)}const mf=new RegExp("[~\\*/\\[\\]]");function ul(r,e,t){if(e.search(mf)>=0)throw Rs(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new Qn(...e.split("."))._internalPath}catch{throw Rs(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function Rs(r,e,t,n,s){const i=n&&!n.isEmpty(),a=s!==void 0;let o=`Function ${e}() called with invalid data`;t&&(o+=" (via `toFirestore()`)"),o+=". ";let u="";return(i||a)&&(u+=" (found",i&&(u+=` in field ${n}`),a&&(u+=` in document ${s}`),u+=")"),new I(p.INVALID_ARGUMENT,o+r+u)}function cl(r,e){return r.some((t=>t.isEqual(e)))}function ll(r){return typeof r._readUserData=="function"}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pe{constructor(e){this.optionDefinitions=e}_getKnownOptions(e,t){const n=ie.empty();for(const s in this.optionDefinitions)if(this.optionDefinitions.hasOwnProperty(s)){const i=this.optionDefinitions[s];if(s in e){const a=e[s];let o;i.nestedOptions&&Mr(a)?o={mapValue:{fields:new pe(i.nestedOptions).getOptionsProto(t,a)}}:a&&(o=At(a,t)??void 0),o&&n.set(te.fromServerFormat(i.serverName),o)}}return n}getOptionsProto(e,t,n){const s=this._getKnownOptions(t,e);if(n){const i=new Map(Gh(n,((a,o)=>[te.fromServerFormat(o),a!==void 0?At(a,e):null])));s.setAll(i)}return s.value.mapValue.fields??{}}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _f(r){return typeof r=="object"&&r!==null&&!!("nullValue"in r&&(r.nullValue===null||r.nullValue==="NULL_VALUE")||"booleanValue"in r&&(r.booleanValue===null||typeof r.booleanValue=="boolean")||"integerValue"in r&&(r.integerValue===null||typeof r.integerValue=="number"||typeof r.integerValue=="string")||"doubleValue"in r&&(r.doubleValue===null||typeof r.doubleValue=="number")||"timestampValue"in r&&(r.timestampValue===null||(function(t){return typeof t=="object"&&t!==null&&"seconds"in t&&(t.seconds===null||typeof t.seconds=="number"||typeof t.seconds=="string")&&"nanos"in t&&(t.nanos===null||typeof t.nanos=="number")})(r.timestampValue))||"stringValue"in r&&(r.stringValue===null||typeof r.stringValue=="string")||"bytesValue"in r&&(r.bytesValue===null||r.bytesValue instanceof Uint8Array)||"referenceValue"in r&&(r.referenceValue===null||typeof r.referenceValue=="string")||"geoPointValue"in r&&(r.geoPointValue===null||(function(t){return typeof t=="object"&&t!==null&&"latitude"in t&&(t.latitude===null||typeof t.latitude=="number")&&"longitude"in t&&(t.longitude===null||typeof t.longitude=="number")})(r.geoPointValue))||"arrayValue"in r&&(r.arrayValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("values"in t)||t.values!==null&&!Array.isArray(t.values))})(r.arrayValue))||"mapValue"in r&&(r.mapValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("fields"in t)||t.fields!==null&&!Mr(t.fields))})(r.mapValue))||"fieldReferenceValue"in r&&(r.fieldReferenceValue===null||typeof r.fieldReferenceValue=="string")||"functionValue"in r&&(r.functionValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("name"in t)||t.name!==null&&typeof t.name!="string"||!("args"in t)||t.args!==null&&!Array.isArray(t.args))})(r.functionValue))||"pipelineValue"in r&&(r.pipelineValue===null||(function(t){return typeof t=="object"&&t!==null&&!(!("stages"in t)||t.stages!==null&&!Array.isArray(t.stages))})(r.pipelineValue)))}function hg(){return new Va("serverTimestamp")}function pf(r){return new Ee(r)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function w(r){let e;return r instanceof rn?r:(e=Mr(r)?Ef(r):r instanceof Array?wf(r):hl(r,void 0),e)}function gi(r){if(r instanceof rn)return r;if(r instanceof Ee)return Rr(r);if(Array.isArray(r))return Rr(pf(r));throw new Error("Unsupported value: "+typeof r)}function ba(r){return Yh(r)?ds(r):w(r)}class rn{constructor(){this._protoValueType="ProtoValue"}add(e){return new g("add",[this,w(e)],"add")}asBoolean(){if(this instanceof Vt)return this;if(this instanceof an)return new fl(this);if(this instanceof sn)return new Tf(this);if(this instanceof g)return new dl(this);throw new I("invalid-argument",`Conversion of type ${typeof this} to BooleanExpression not supported.`)}subtract(e){return new g("subtract",[this,w(e)],"subtract")}multiply(e){return new g("multiply",[this,w(e)],"multiply")}divide(e){return new g("divide",[this,w(e)],"divide")}mod(e){return new g("mod",[this,w(e)],"mod")}equal(e){return new g("equal",[this,w(e)],"equal").asBoolean()}notEqual(e){return new g("not_equal",[this,w(e)],"notEqual").asBoolean()}lessThan(e){return new g("less_than",[this,w(e)],"lessThan").asBoolean()}lessThanOrEqual(e){return new g("less_than_or_equal",[this,w(e)],"lessThanOrEqual").asBoolean()}greaterThan(e){return new g("greater_than",[this,w(e)],"greaterThan").asBoolean()}greaterThanOrEqual(e){return new g("greater_than_or_equal",[this,w(e)],"greaterThanOrEqual").asBoolean()}arrayConcat(e,...t){const n=[e,...t].map((s=>w(s)));return new g("array_concat",[this,...n],"arrayConcat")}arrayContains(e){return new g("array_contains",[this,w(e)],"arrayContains").asBoolean()}arrayContainsAll(e){const t=Array.isArray(e)?new ar(e.map(w),"arrayContainsAll"):e;return new g("array_contains_all",[this,t],"arrayContainsAll").asBoolean()}arrayContainsAny(e){const t=Array.isArray(e)?new ar(e.map(w),"arrayContainsAny"):e;return new g("array_contains_any",[this,t],"arrayContainsAny").asBoolean()}arrayReverse(){return new g("array_reverse",[this])}arrayLength(){return new g("array_length",[this],"arrayLength")}equalAny(e){const t=Array.isArray(e)?new ar(e.map(w),"equalAny"):e;return new g("equal_any",[this,t],"equalAny").asBoolean()}notEqualAny(e){const t=Array.isArray(e)?new ar(e.map(w),"notEqualAny"):e;return new g("not_equal_any",[this,t],"notEqualAny").asBoolean()}exists(){return new g("exists",[this],"exists").asBoolean()}charLength(){return new g("char_length",[this],"charLength")}like(e){return new g("like",[this,w(e)],"like").asBoolean()}regexContains(e){return new g("regex_contains",[this,w(e)],"regexContains").asBoolean()}regexFind(e){return new g("regex_find",[this,w(e)],"regexFind")}regexFindAll(e){return new g("regex_find_all",[this,w(e)],"regexFindAll")}regexMatch(e){return new g("regex_match",[this,w(e)],"regexMatch").asBoolean()}stringContains(e){return new g("string_contains",[this,w(e)],"stringContains").asBoolean()}startsWith(e){return new g("starts_with",[this,w(e)],"startsWith").asBoolean()}endsWith(e){return new g("ends_with",[this,w(e)],"endsWith").asBoolean()}toLower(){return new g("to_lower",[this],"toLower")}toUpper(){return new g("to_upper",[this],"toUpper")}trim(e){const t=[this];return e&&t.push(w(e)),new g("trim",t,"trim")}ltrim(e){const t=[this];return e&&t.push(w(e)),new g("ltrim",t,"ltrim")}rtrim(e){const t=[this];return e&&t.push(w(e)),new g("rtrim",t,"rtrim")}type(){return new g("type",[this])}isType(e){return new g("is_type",[this,Rr(e)],"isType").asBoolean()}stringConcat(e,...t){const n=[e,...t].map(w);return new g("string_concat",[this,...n],"stringConcat")}stringIndexOf(e){return new g("string_index_of",[this,w(e)],"stringIndexOf")}stringRepeat(e){return new g("string_repeat",[this,w(e)],"stringRepeat")}stringReplaceAll(e,t){return new g("string_replace_all",[this,w(e),w(t)],"stringReplaceAll")}stringReplaceOne(e,t){return new g("string_replace_one",[this,w(e),w(t)],"stringReplaceOne")}concat(e,...t){const n=[e,...t].map(w);return new g("concat",[this,...n],"concat")}reverse(){return new g("reverse",[this],"reverse")}arrayFilter(e,t){return new g("array_filter",[this,w(e),t],"arrayFilter")}arrayTransform(e,t){return new g("array_transform",[this,w(e),t],"arrayTransform")}arrayTransformWithIndex(e,t,n){return new g("array_transform",[this,w(e),w(t),n],"arrayTransformWithIndex")}arraySlice(e,t){const n=[this,w(e)];return t!==void 0&&n.push(w(t)),new g("array_slice",n,"arraySlice")}arrayFirst(){return new g("array_first",[this],"arrayFirst")}arrayFirstN(e){return new g("array_first_n",[this,w(e)],"arrayFirstN")}arrayLast(){return new g("array_last",[this],"arrayLast")}arrayLastN(e){return new g("array_last_n",[this,w(e)],"arrayLastN")}arrayMaximum(){return new g("maximum",[this],"arrayMaximum")}arrayMaximumN(e){return new g("maximum_n",[this,w(e)],"arrayMaximumN")}arrayMinimum(){return new g("minimum",[this],"arrayMinimum")}arrayMinimumN(e){return new g("minimum_n",[this,w(e)],"arrayMinimumN")}arrayIndexOf(e){return new g("array_index_of",[this,w(e),w("first")],"arrayIndexOf")}arrayLastIndexOf(e){return new g("array_index_of",[this,w(e),w("last")],"arrayLastIndexOf")}arrayIndexOfAll(e){return new g("array_index_of_all",[this,w(e)],"arrayIndexOfAll")}byteLength(){return new g("byte_length",[this],"byteLength")}ceil(){return new g("ceil",[this])}floor(){return new g("floor",[this])}abs(){return new g("abs",[this])}exp(){return new g("exp",[this])}mapGet(e){return new g("map_get",[this,Rr(e)],"mapGet")}mapSet(e,t,...n){const s=[this,w(e),w(t),...n.map(w)];return new g("map_set",s,"mapSet")}mapKeys(){return new g("map_keys",[this],"mapKeys")}mapValues(){return new g("map_values",[this],"mapValues")}mapEntries(){return new g("map_entries",[this],"mapEntries")}getField(e){return new g("get_field",[this,w(e)],"get_field")}count(){return ve._create("count",[this],"count")}sum(){return ve._create("sum",[this],"sum")}average(){return ve._create("average",[this],"average")}minimum(){return ve._create("minimum",[this],"minimum")}maximum(){return ve._create("maximum",[this],"maximum")}first(){return ve._create("first",[this],"first")}last(){return ve._create("last",[this],"last")}arrayAgg(){return ve._create("array_agg",[this],"arrayAgg")}arrayAggDistinct(){return ve._create("array_agg_distinct",[this],"arrayAggDistinct")}countDistinct(){return ve._create("count_distinct",[this],"countDistinct")}logicalMaximum(e,...t){const n=[e,...t];return new g("maximum",[this,...n.map(w)],"logicalMaximum")}logicalMinimum(e,...t){const n=[e,...t];return new g("minimum",[this,...n.map(w)],"minimum")}vectorLength(){return new g("vector_length",[this],"vectorLength")}cosineDistance(e){return new g("cosine_distance",[this,gi(e)],"cosineDistance")}dotProduct(e){return new g("dot_product",[this,gi(e)],"dotProduct")}euclideanDistance(e){return new g("euclidean_distance",[this,gi(e)],"euclideanDistance")}unixMicrosToTimestamp(){return new g("unix_micros_to_timestamp",[this],"unixMicrosToTimestamp")}timestampToUnixMicros(){return new g("timestamp_to_unix_micros",[this],"timestampToUnixMicros")}unixMillisToTimestamp(){return new g("unix_millis_to_timestamp",[this],"unixMillisToTimestamp")}timestampToUnixMillis(){return new g("timestamp_to_unix_millis",[this],"timestampToUnixMillis")}unixSecondsToTimestamp(){return new g("unix_seconds_to_timestamp",[this],"unixSecondsToTimestamp")}timestampToUnixSeconds(){return new g("timestamp_to_unix_seconds",[this],"timestampToUnixSeconds")}timestampAdd(e,t){return new g("timestamp_add",[this,w(e),w(t)],"timestampAdd")}timestampSubtract(e,t){return new g("timestamp_subtract",[this,w(e),w(t)],"timestampSubtract")}timestampDiff(e,t){return new g("timestamp_diff",[this,ba(e),w(t)],"timestampDiff")}timestampExtract(e,t){const n=[this,w(e)];return t&&n.push(w(t)),new g("timestamp_extract",n,"timestampExtract")}documentId(){return new g("document_id",[this],"documentId")}parent(){return new g("parent",[this],"parent")}substring(e,t){const n=w(e);return new g("substring",t===void 0?[this,n]:[this,n,w(t)],"substring")}arrayGet(e){return new g("array_get",[this,w(e)],"arrayGet")}isError(){return new g("is_error",[this],"isError").asBoolean()}ifError(e){const t=new g("if_error",[this,w(e)],"ifError");return e instanceof Vt?t.asBoolean():t}isAbsent(){return new g("is_absent",[this],"isAbsent").asBoolean()}mapRemove(e){return new g("map_remove",[this,w(e)],"mapRemove")}mapMerge(e,...t){const n=w(e),s=t.map(w);return new g("map_merge",[this,n,...s],"mapMerge")}pow(e){return new g("pow",[this,w(e)])}trunc(e){return e===void 0?new g("trunc",[this]):new g("trunc",[this,w(e)],"trunc")}round(e){return e===void 0?new g("round",[this]):new g("round",[this,w(e)],"round")}collectionId(){return new g("collection_id",[this])}length(){return new g("length",[this])}ln(){return new g("ln",[this])}sqrt(){return new g("sqrt",[this])}stringReverse(){return new g("string_reverse",[this])}ifAbsent(e){return new g("if_absent",[this,w(e)],"ifAbsent")}ifNull(e){return new g("if_null",[this,w(e)],"ifNull")}coalesce(e,...t){return new g("coalesce",[this,w(e),...t.map(w)],"coalesce")}join(e){return new g("join",[this,w(e)],"join")}log10(){return new g("log10",[this])}arraySum(){return new g("sum",[this])}split(e){return new g("split",[this,w(e)])}timestampTruncate(e,t){const n=[this,w(e)];return t&&n.push(w(t)),new g("timestamp_trunc",n)}ascending(){return Af(this)}descending(){return Vf(this)}as(e){return new yf(this,e,"as")}}class ve{constructor(e,t){this.name=e,this.params=t,this.exprType="AggregateFunction",this._protoValueType="ProtoValue"}static _create(e,t,n){const s=new ve(e,t);return s._methodName=n,s}as(e){return new gf(this,e,"as")}_toProto(e){return{functionValue:{name:this.name,args:this.params.map((t=>t._toProto(e)))}}}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((t=>t._readUserData(e)))}}class gf{constructor(e,t,n){this.aggregate=e,this.alias=t,this._methodName=n}_readUserData(e){this.aggregate._readUserData(e)}}class yf{constructor(e,t,n){this.expr=e,this.alias=t,this._methodName=n,this.exprType="AliasedExpression",this.selectable=!0}_readUserData(e){this.expr._readUserData(e)}}class ar extends rn{constructor(e,t){super(),this.cr=e,this._methodName=t,this.expressionType="ListOfExpressions"}_toProto(e){return{arrayValue:{values:this.cr.map((t=>t._toProto(e)))}}}_readUserData(e){this.cr.forEach((t=>t._readUserData(e)))}}class sn extends rn{constructor(e,t){super(),this.fieldPath=e,this._methodName=t,this.expressionType="Field",this.selectable=!0}get _fieldPath(){return this.fieldPath}get fieldName(){return this.fieldPath.canonicalString()}get alias(){return this.fieldName}get expr(){return this}geoDistance(e){return new g("geo_distance",[this,w(e)],"geoDistance")}_toProto(e){return{fieldReferenceValue:this.fieldPath.canonicalString()}}_readUserData(e){}}function ds(r){return If(r,"field")}function If(r,e){return new sn(typeof r=="string"?Ue===r?Bd()._internalPath:rt("field",r):r._internalPath,e)}class an extends rn{constructor(e,t){super(),this.value=e,this._methodName=t,this.expressionType="Constant"}static _fromProto(e){const t=new an(e,void 0);return t._protoValue=e,t}_toProto(e){return E(this._protoValue!==void 0,237),this._protoValue}_getValue(){return this._protoValue}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,_f(this._protoValue)||(this._protoValue=At(this.value,e))}}function Rr(r,e){return hl(r,"constant")}function hl(r,e){const t=new an(r,e);return typeof r=="boolean"?new fl(t):t}class g extends rn{constructor(e,t,n,s){super(),this.name=e,this.params=t,this.expressionType="Function",this._optionsProto=void 0,n!==void 0&&(this._methodName=n),s!==void 0&&(this._options=s)}get _optionsUtil(){return new pe({})}_toProto(e){const t={functionValue:{name:this.name,args:this.params.map((n=>n._toProto(e)))}};return this._optionsProto&&(t.functionValue.options=this._optionsProto),t}_readUserData(e){e=this._methodName?e.contextWith({methodName:this._methodName}):e,this.params.forEach((t=>t._readUserData(e))),this._options&&(this._optionsProto=this._optionsUtil.getOptionsProto(e,this._options))}}class Vt extends rn{get _methodName(){return this._expr._methodName}countIf(){return ve._create("count_if",[this],"countIf")}not(){return new g("not",[this],"not").asBoolean()}conditional(e,t){return new g("conditional",[this,e,t],"conditional")}ifError(e){const t=w(e),n=new g("if_error",[this,t],"ifError");return t instanceof Vt?n.asBoolean():n}_toProto(e){return this._expr._toProto(e)}_readUserData(e){this._expr._readUserData(e)}}class dl extends Vt{constructor(e){super(),this._expr=e,this.expressionType="Function"}}class fl extends Vt{constructor(e){super(),this._expr=e,this.expressionType="Constant"}_getValue(){return this._expr._getValue()}}class Tf extends Vt{constructor(e){super(),this._expr=e,this.expressionType="Field"}}function Ef(r,e){const t=[];for(const n in r)if(Object.prototype.hasOwnProperty.call(r,n)){const s=r[n];t.push(Rr(n)),t.push(w(s))}return new g("map",t,"map")}function wf(r){return(function(t,n){return new g("array",t.map((s=>w(s))),n)})(r,"array")}function Af(r){return new xa(ba(r),"ascending","ascending")}function Vf(r){return new xa(ba(r),"descending","descending")}class xa{constructor(e,t,n){this.expr=e,this.direction=t,this._methodName=n,this._protoValueType="ProtoValue"}_toProto(e){return{mapValue:{fields:{direction:Qc(this.direction),expression:this.expr._toProto(e)}}}}_readUserData(e){this.expr._readUserData(e)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ce{constructor(e){this.optionsProto=void 0,{rawOptions:this.rawOptions,...this.knownOptions}=e}_readUserData(e){this.optionsProto=this._optionsUtil.getOptionsProto(e,this.knownOptions,this.rawOptions)}_toProto(e){return{name:this._name,options:this.optionsProto}}}class ml extends Ce{get _name(){return"add_fields"}get _optionsUtil(){return new pe({})}constructor(e,t){super(t),this.fields=e}_toProto(e){return{...super._toProto(e),args:[vr(e,this.fields)]}}_readUserData(e){super._readUserData(e),Rt(this.fields,e)}}class _l extends Ce{get _name(){return"aggregate"}get _optionsUtil(){return new pe({})}constructor(e,t,n){super(n),this.groups=e,this.accumulators=t}_toProto(e){return{...super._toProto(e),args:[vr(e,this.accumulators),vr(e,this.groups)]}}_readUserData(e){super._readUserData(e),Rt(this.groups,e),Rt(this.accumulators,e)}}class pl extends Ce{get _name(){return"distinct"}get _optionsUtil(){return new pe({})}constructor(e,t){super(t),this.groups=e}_toProto(e){return{...super._toProto(e),args:[vr(e,this.groups)]}}_readUserData(e){super._readUserData(e),Rt(this.groups,e)}}class Kr extends Ce{get _name(){return"collection"}get _optionsUtil(){return new pe({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.hr=e.startsWith("/")?e:"/"+e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:this.hr}]}}_readUserData(e){super._readUserData(e)}}class Qr extends Ce{get _name(){return"collection_group"}get _optionsUtil(){return new pe({forceIndex:{serverName:"force_index"}})}constructor(e,t){super(t),this.collectionId=e}_toProto(e){return{...super._toProto(e),args:[{referenceValue:""},{stringValue:this.collectionId}]}}_readUserData(e){super._readUserData(e)}}class Ys extends Ce{get _name(){return"database"}get _optionsUtil(){return new pe({})}_toProto(e){return{...super._toProto(e)}}_readUserData(e){super._readUserData(e)}}class Js extends Ce{get _name(){return"documents"}get _optionsUtil(){return new pe({})}constructor(e,t){if(super(t),!e||e.length===0)throw new I(p.INVALID_ARGUMENT,"Empty document paths are not allowed in DocumentsSource");const n=e.map((i=>i.startsWith("/")?i:"/"+i)),s=new Set(n);if(s.size!==n.length)throw new I(p.INVALID_ARGUMENT,"Duplicate document paths are not allowed in DocumentsSource");this.Tr=n,this.Pr=s}_toProto(e){return{...super._toProto(e),args:this.Tr.map((t=>({referenceValue:t})))}}_readUserData(e){super._readUserData(e)}}class jr extends Ce{get _name(){return"where"}get _optionsUtil(){return new pe({})}constructor(e,t){super(t),this.condition=e}_toProto(e){return{...super._toProto(e),args:[this.condition._toProto(e)]}}_readUserData(e){super._readUserData(e),Rt(this.condition,e)}}class vt extends Ce{get _name(){return"limit"}get _optionsUtil(){return new pe({})}constructor(e,t){E(!isNaN(e)&&e!==1/0&&e!==-1/0,34860),super(t),this.limit=e}_toProto(e){return{...super._toProto(e),args:[aa(e,this.limit)]}}}class ou extends Ce{get _name(){return"offset"}get _optionsUtil(){return new pe({})}constructor(e,t){super(t),this.offset=e}_toProto(e){return{...super._toProto(e),args:[aa(e,this.offset)]}}}class vf extends Ce{get _name(){return"select"}get _optionsUtil(){return new pe({})}constructor(e,t){super(t),this.selections=e}_toProto(e){return{...super._toProto(e),args:[vr(e,this.selections)]}}_readUserData(e){super._readUserData(e),Rt(this.selections,e)}}class qe extends Ce{get _name(){return"sort"}get _optionsUtil(){return new pe({})}constructor(e,t){super(t),this.orderings=e}_toProto(e){return{...super._toProto(e),args:this.orderings.map((t=>t._toProto(e)))}}_readUserData(e){super._readUserData(e),Rt(this.orderings,e)}}class Sa extends Ce{get _name(){return"replace_with"}get _optionsUtil(){return new pe({})}constructor(e,t){super(t),this.map=e}_toProto(e){return{...super._toProto(e),args:[this.map._toProto(e),Qc(Sa.Ir)]}}_readUserData(e){super._readUserData(e),Rt(this.map,e)}}Sa.Ir="full_replace";function Rt(r,e){return ll(r)?r._readUserData(e):Array.isArray(r)?r.forEach((t=>t._readUserData(e))):r instanceof Map?r.forEach((t=>t._readUserData(e))):Object.values(r).forEach((t=>t._readUserData(e))),r}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fr{constructor(e,t,n,s){this._db=e,this.userDataReader=t,this._userDataWriter=n,this.stages=s}Vr(e,t){const n=this.userDataReader.createContext(3,e);return ll(t)?t._readUserData(n):Array.isArray(t)?t.forEach((s=>s._readUserData(n))):t.forEach((s=>s._readUserData(n))),t}where(e){const t=this.stages.map((n=>n));return this.Vr("where",e),t.push(new jr(e,{})),new fr(this._db,this.userDataReader,this._userDataWriter,t)}limit(e){const t=this.stages.map((n=>n));return t.push(new vt(e,{})),new fr(this._db,this.userDataReader,this._userDataWriter,t)}sort(e,...t){const n=this.stages.map((s=>s));return"orderings"in e?n.push(new qe(this.Vr("sort",e.orderings),{})):n.push(new qe(this.Vr("sort",[e,...t]),{})),new fr(this._db,this.userDataReader,this._userDataWriter,n)}dr(e){return{pipeline:{stages:this.stages.map((t=>t._toProto(e)))}}}}// Copyright 2024 Google LLC* @license
class fe{constructor(e,t,n){this.serializer=e,this.stages=t,this.listenOptions=n,this.isCorePipeline=!0}getPipelineCollection(){return Wr(this)}getPipelineCollectionGroup(){return Ca(this)}getPipelineCollectionId(){return gl(this)}getPipelineDocuments(){return Ps(this)}getPipelineFlavor(){return(function(t){let n="exact";return t.stages.forEach(((s,i)=>{s._name!==pl.name&&s._name!==_l.name||(n="keyless"),s._name===vf.name&&n==="exact"&&(n="augmented"),s._name===ml.name&&i<t.stages.length-1&&n==="exact"&&(n="augmented")})),n})(this)}getPipelineSourceType(){return Ze(this)}}function Ze(r){const e=r.stages[0];return e instanceof Kr||e instanceof Qr||e instanceof Ys||e instanceof Js?e._name:"unknown"}function Wr(r){if(Ze(r)==="collection")return r.stages[0].hr}function Ca(r){if(Ze(r)==="collection_group")return r.stages[0].collectionId}function gl(r){switch(Ze(r)){case"collection":return D.fromString(Wr(r)).lastSegment();case"collection_group":return Ca(r);default:return}}function Ps(r){if(Ze(r)==="documents")return r.stages[0].Tr}class f{constructor(e,t){this.type=e,this.value=t}static mr(){return new f("ERROR",void 0)}static pr(){return new f("UNSET",void 0)}static gr(){return new f("NULL",Ge)}static newValue(e){return be(e)?new f("NULL",Ge):(function(n){return!!n&&"booleanValue"in n})(e)?new f("BOOLEAN",e):Be(e)?new f("INT",e):Bt(e)?new f("DOUBLE",e):(function(n){return!!n&&"timestampValue"in n&&!!n.timestampValue})(e)?new f("TIMESTAMP",e):(function(n){return!!n&&"stringValue"in n})(e)?new f("STRING",e):(function(n){return!!n&&"bytesValue"in n})(e)?new f("BYTES",e):e.referenceValue?new f("REFERENCE",e):e.geoPointValue?new f("GEO_POINT",e):Et(e)?new f("ARRAY",e):Zt(e)?new f("VECTOR",e):Gt(e)?new f("MAP",e):new f("ERROR",void 0)}yr(){return this.type==="ERROR"||this.type==="UNSET"}wr(){return this.type==="NULL"}}function mr(r){if(!r.yr())return r.value}function yl(r){return r instanceof Vt?r._expr:r}function x(r){if((r=yl(r))instanceof sn)return new Rf(r);if(r instanceof an)return new Pf(r);if(r instanceof ar)return new bf(r);if(r instanceof g){if(r.name==="add")return new Cf(r);if(r.name==="subtract")return new Df(r);if(r.name==="multiply")return new Nf(r);if(r.name==="divide")return new kf(r);if(r.name==="mod")return new Lf(r);if(r.name==="and")return new Of(r);if(r.name==="equal")return new Wf(r);if(r.name==="not_equal")return new Hf(r);if(r.name==="less_than")return new Yf(r);if(r.name==="less_than_or_equal")return new Jf(r);if(r.name==="greater_than")return new Xf(r);if(r.name==="greater_than_or_equal")return new Zf(r);if(r.name==="array_concat")return new em(r);if(r.name==="array_reverse")return new tm(r);if(r.name==="array_contains")return new nm(r);if(r.name==="array_contains_all")return new rm(r);if(r.name==="array_contains_any")return new sm(r);if(r.name==="array_length")return new im(r);if(r.name==="array_element")return new am(r);if(r.name==="equal_any")return new Il(r);if(r.name==="not_equal_any")return new Ff(r);if(r.name==="is_nan")return new Uf(r);if(r.name==="is_not_nan")return new Bf(r);if(r.name==="is_null")return new qf(r);if(r.name==="is_not_null")return new $f(r);if(r.name==="is_error")return new zf(r);if(r.name==="exists")return new Gf(r);if(r.name==="not")return new Xs(r);if(r.name==="or")return new Mf(r);if(r.name==="xor")return new Da(r);if(r.name==="conditional")return new Kf(r);if(r.name==="maximum")return new Qf(r);if(r.name==="minimum")return new jf(r);if(r.name==="reverse")return new om(r);if(r.name==="replace_first")return new um(r);if(r.name==="replace_all")return new cm(r);if(r.name==="char_length")return new lm(r);if(r.name==="byte_length")return new hm(r);if(r.name==="like")return new dm(r);if(r.name==="regex_contains")return new fm(r);if(r.name==="regex_match")return new mm(r);if(r.name==="string_contains")return new _m(r);if(r.name==="starts_with")return new pm(r);if(r.name==="ends_with")return new gm(r);if(r.name==="to_lower")return new ym(r);if(r.name==="to_upper")return new Im(r);if(r.name==="trim")return new Tm(r);if(r.name==="string_concat")return new Em(r);if(r.name==="map_get")return new wm(r);if(r.name==="cosine_distance")return new Am(r);if(r.name==="dot_product")return new Vm(r);if(r.name==="euclidean_distance")return new vm(r);if(r.name==="vector_length")return new Rm(r);if(r.name==="unix_micros_to_timestamp")return new Cm(r);if(r.name==="timestamp_to_unix_micros")return new km(r);if(r.name==="unix_millis_to_timestamp")return new Dm(r);if(r.name==="timestamp_to_unix_millis")return new Lm(r);if(r.name==="unix_seconds_to_timestamp")return new Nm(r);if(r.name==="timestamp_to_unix_seconds")return new Om(r);if(r.name==="timestamp_add")return new Mm(r);if(r.name==="timestamp_subtract")return new Fm(r)}throw new Error(`Unknown Expr : ${r}`)}class Rf{constructor(e){this.expr=e}evaluate(e,t){if(this.expr.fieldName===Ue)return f.newValue({referenceValue:kn(e.serializer,t.key)});if(this.expr.fieldName==="__update_time__")return f.newValue({timestampValue:hs(e.serializer,t.version)});if(this.expr.fieldName==="__create_time__")return f.newValue({timestampValue:hs(e.serializer,t.createTime)});const n=t.data.field(this.expr._fieldPath);return n?Ur(n)?f.newValue((function(i,a){if(i.serverTimestampBehavior==="estimate")return{timestampValue:hs(i.serializer,b.fromTimestamp(vn(a)))};if(i.serverTimestampBehavior==="previous"){const o=Br(a);if(o)return o}return{nullValue:"NULL_VALUE"}})(e,n)):f.newValue(n):f.pr()}}class Pf{constructor(e){this.expr=e}evaluate(e,t){return f.newValue(this.expr._getValue())}}class bf{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.cr.map((s=>x(s).evaluate(e,t)));return n.some((s=>s.yr()))?f.mr():f.newValue({arrayValue:{values:n.map((s=>s.value))}})}}function ce(r){return Bt(r)?Number(r.doubleValue):Number(r.integerValue)}function Qe(r){return BigInt(r.integerValue)}const xf=BigInt("0x7fffffffffffffff"),Sf=-BigInt("0x8000000000000000");class Hr{constructor(e){this.expr=e}evaluate(e,t){E(this.expr.params.length>=2,24778);const n=x(this.expr.params[0]).evaluate(e,t),s=x(this.expr.params[1]).evaluate(e,t);let i=this.br(n,s);for(const a of this.expr.params.slice(2)){const o=x(a).evaluate(e,t);i=this.br(i,o)}return i}br(e,t){if(e.yr()||t.yr())return f.mr();if(e.wr()||t.wr())return f.gr();const n=e.value,s=t.value;if(!Bt(n)&&!Be(n)||!Bt(s)&&!Be(s))return f.mr();if(Bt(n)||Bt(s)){const i=this.Sr(n,s);return i?f.newValue(i):f.mr()}if(Be(n)&&Be(s)){const i=this.vr(n,s);return i===void 0?f.mr():typeof i=="number"?f.newValue({doubleValue:i}):i<Sf||i>xf?f.mr():f.newValue({integerValue:`${i}`})}return f.mr()}}function st(r,e){return X(r)!==X(e)?"TYPE_MISMATCH":Ve(r)||Ve(e)?"NOT_EQ":be(r)&&be(e)?"EQ":be(r)||be(e)?"NULL":Et(r)&&Et(e)?(function(n,s){var a,o,u;if(((a=n.values)==null?void 0:a.length)!==((o=s.values)==null?void 0:o.length))return"NOT_EQ";let i=!1;for(let c=0;c<(((u=n.values)==null?void 0:u.length)??0);c++){const l=n.values[c],h=s.values[c];switch(st(l,h)){case"EQ":break;case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":i=!0;break;default:V(44609,{Dr:l,Cr:h})}}return i?"NULL":"EQ"})(r.arrayValue,e.arrayValue):Zt(r)&&Zt(e)||Gt(r)&&Gt(e)?(function(n,s){const i=n.fields||{},a=s.fields||{};if(Is(i)!==Is(a))return"NOT_EQ";let o=!1;for(const u in i)if(i.hasOwnProperty(u)){if(a[u]===void 0)return"NOT_EQ";switch(st(i[u],a[u])){case"NOT_EQ":case"TYPE_MISMATCH":return"NOT_EQ";case"NULL":o=!0}}return o?"NULL":"EQ"})(r.mapValue,e.mapValue):(function(n,s){return Ne(n,s,{u:!1,i:!0,o:!0})})(r,e)?"EQ":"NOT_EQ"}class Cf extends Hr{vr(e,t){return Qe(e)+Qe(t)}Sr(e,t){return{doubleValue:ce(e)+ce(t)}}}class Df extends Hr{constructor(e){super(e),this.expr=e}vr(e,t){return Qe(e)-Qe(t)}Sr(e,t){return{doubleValue:ce(e)-ce(t)}}}class Nf extends Hr{constructor(e){super(e),this.expr=e}vr(e,t){return Qe(e)*Qe(t)}Sr(e,t){return{doubleValue:ce(e)*ce(t)}}}class kf extends Hr{constructor(e){super(e),this.expr=e}vr(e,t){const n=Qe(t);if(n!==BigInt(0))return Qe(e)/n}Sr(e,t){const n=ce(t);return n===0?{doubleValue:Rn(n)?Number.NEGATIVE_INFINITY:Number.POSITIVE_INFINITY}:{doubleValue:ce(e)/n}}}class Lf extends Hr{constructor(e){super(e),this.expr=e}vr(e,t){const n=Qe(t);if(n!==BigInt(0))return Qe(e)%n}Sr(e,t){const n=ce(t);if(n!==0)return{doubleValue:ce(e)%n}}}class Of{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const a of this.expr.params){const o=x(a).evaluate(e,t);switch(o.type){case"BOOLEAN":if(!((i=o.value)!=null&&i.booleanValue))return f.newValue(ae);break;case"NULL":s=!0;break;default:n=!0}}return n?f.mr():s?f.gr():f.newValue(Ae)}}class Xs{constructor(e){this.expr=e}evaluate(e,t){var s;E(this.expr.params.length===1,9634);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return f.newValue({booleanValue:!((s=n.value)!=null&&s.booleanValue)});case"NULL":return f.gr();default:return f.mr()}}}class Mf{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const a of this.expr.params){const o=x(a).evaluate(e,t);switch(o.type){case"BOOLEAN":if((i=o.value)!=null&&i.booleanValue)return f.newValue(Ae);break;case"NULL":s=!0;break;default:n=!0}}return n?f.mr():s?f.gr():f.newValue(ae)}}class Da{constructor(e){this.expr=e}evaluate(e,t){var i;let n=!1,s=!1;for(const a of this.expr.params){const o=x(a).evaluate(e,t);switch(o.type){case"BOOLEAN":n=Da.xor(n,!!((i=o.value)!=null&&i.booleanValue));break;case"NULL":s=!0;break;default:return f.mr()}}return s?f.gr():f.newValue({booleanValue:n})}static xor(e,t){return(e||t)&&!(e&&t)}}class Il{constructor(e){this.expr=e}evaluate(e,t){var a,o;E(this.expr.params.length===2,55094);let n=!1;const s=x(this.expr.params[0]).evaluate(e,t);switch(s.type){case"NULL":n=!0;break;case"ERROR":case"UNSET":return f.mr()}const i=x(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return f.mr()}if(n)return f.gr();for(const u of((o=(a=i.value)==null?void 0:a.arrayValue)==null?void 0:o.values)??[])switch(be(s.value)&&be(u)?"EQ":st(s.value,u)){case"EQ":return f.newValue(Ae);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:V(44608,{value:s.value,candidate:u})}return n?f.gr():f.newValue(ae)}}class Ff{constructor(e){this.expr=e}evaluate(e,t){return new Xs(new g("not",[new g("equal_any",this.expr.params)])).evaluate(e,t)}}class Uf{constructor(e){this.expr=e}evaluate(e,t){E(this.expr.params.length===1,23322);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return f.newValue(ae);case"DOUBLE":return f.newValue({booleanValue:isNaN(ce(n.value))});case"NULL":return f.gr();default:return f.mr()}}}class Bf{constructor(e){this.expr=e}evaluate(e,t){return E(this.expr.params.length===1,50406),new Xs(new g("not",[new g("is_nan",this.expr.params)])).evaluate(e,t)}}class qf{constructor(e){this.expr=e}evaluate(e,t){switch(E(this.expr.params.length===1,23123),x(this.expr.params[0]).evaluate(e,t).type){case"NULL":return f.newValue(Ae);case"UNSET":case"ERROR":return f.mr();default:return f.newValue(ae)}}}class $f{constructor(e){this.expr=e}evaluate(e,t){return E(this.expr.params.length===1,23167),new Xs(new g("not",[new g("is_null",this.expr.params)])).evaluate(e,t)}}class zf{constructor(e){this.expr=e}evaluate(e,t){return E(this.expr.params.length===1,5228),x(this.expr.params[0]).evaluate(e,t).type==="ERROR"?f.newValue(Ae):f.newValue(ae)}}class Gf{constructor(e){this.expr=e}evaluate(e,t){switch(E(this.expr.params.length===1,6877),x(this.expr.params[0]).evaluate(e,t).type){case"ERROR":return f.mr();case"UNSET":return f.newValue(ae);default:return f.newValue(Ae)}}}class Kf{constructor(e){this.expr=e}evaluate(e,t){var s;E(this.expr.params.length===3,11706);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BOOLEAN":return(s=n.value)!=null&&s.booleanValue?x(this.expr.params[1]).evaluate(e,t):x(this.expr.params[2]).evaluate(e,t);case"NULL":return x(this.expr.params[2]).evaluate(e,t);default:return f.mr()}}}class Qf{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map((i=>x(i).evaluate(e,t)));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||_e(i.value,s.value)>0?i:s}return s===void 0?f.gr():s}}class jf{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map((i=>x(i).evaluate(e,t)));let s;for(const i of n)switch(i.type){case"ERROR":case"UNSET":case"NULL":continue;default:s=s===void 0||_e(i.value,s.value)<0?i:s}return s===void 0?f.gr():s}}class Wn{constructor(e){this.expr=e}evaluate(e,t){E(this.expr.params.length===2,31033,`${this.expr.name}() function should have exactly 2 params`);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"ERROR":case"UNSET":return f.mr()}const s=x(this.expr.params[1]).evaluate(e,t);switch(s.type){case"ERROR":case"UNSET":return f.mr()}return this.Fr(n,s)}}class Wf extends Wn{constructor(e){super(e),this.expr=e}Fr(e,t){if(e.wr()&&t.wr())return f.newValue(Ae);if(e.wr()||t.wr()||Ve(e.value)||Ve(t.value)||X(e.value)!==X(t.value))return f.newValue(ae);switch(st(e.value,t.value)){case"EQ":return f.newValue(Ae);case"NOT_EQ":return f.newValue(ae);case"NULL":return f.gr();default:V(44615,{left:e,right:t})}}}class Hf extends Wn{constructor(e){super(e),this.expr=e}Fr(e,t){switch(st(e.value,t.value)){case"EQ":return f.newValue(ae);case"NOT_EQ":case"TYPE_MISMATCH":return f.newValue(Ae);case"NULL":return f.gr();default:V(44614,{left:e,right:t})}}}class Yf extends Wn{constructor(e){super(e),this.expr=e}Fr(e,t){return X(e.value)!==X(t.value)||Ve(e.value)||Ve(t.value)?f.newValue(ae):f.newValue({booleanValue:_e(e.value,t.value)<0})}}class Jf extends Wn{constructor(e){super(e),this.expr=e}Fr(e,t){return X(e.value)!==X(t.value)||Ve(e.value)||Ve(t.value)?f.newValue(ae):st(e.value,t.value)==="EQ"?f.newValue(Ae):f.newValue({booleanValue:_e(e.value,t.value)<0})}}class Xf extends Wn{constructor(e){super(e),this.expr=e}Fr(e,t){return X(e.value)!==X(t.value)||Ve(e.value)||Ve(t.value)?f.newValue(ae):f.newValue({booleanValue:_e(e.value,t.value)>0})}}class Zf extends Wn{constructor(e){super(e),this.expr=e}Fr(e,t){return X(e.value)!==X(t.value)||Ve(e.value)||Ve(t.value)?f.newValue(ae):st(e.value,t.value)==="EQ"?f.newValue(Ae):f.newValue({booleanValue:_e(e.value,t.value)>0})}}class em{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class tm{constructor(e){this.expr=e}evaluate(e,t){var s;E(this.expr.params.length===1,216);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return f.gr();case"ARRAY":{const i=((s=n.value.arrayValue)==null?void 0:s.values)??[];return f.newValue({arrayValue:{values:[...i].reverse()}})}default:return f.mr()}}}class nm{constructor(e){this.expr=e}evaluate(e,t){return E(this.expr.params.length===2,52884),new Il(new g("eq_any",[this.expr.params[1],this.expr.params[0]])).evaluate(e,t)}}class rm{constructor(e){this.expr=e}evaluate(e,t){var u,c,l,h;E(this.expr.params.length===2,1392);let n=!1;const s=x(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return f.mr()}const i=x(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return f.mr()}if(n)return f.gr();const a=((c=(u=i.value)==null?void 0:u.arrayValue)==null?void 0:c.values)??[],o=((h=(l=s.value)==null?void 0:l.arrayValue)==null?void 0:h.values)??[];for(const d of a){let _=!1;n=!1;for(const y of o){switch(be(d)&&be(y)?"EQ":st(d,y)){case"EQ":_=!0;break;case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:V(44613,{value:y,search:d})}if(_)break}if(!_)return f.newValue(ae)}return f.newValue(Ae)}}class sm{constructor(e){this.expr=e}evaluate(e,t){var u,c,l,h;E(this.expr.params.length===2,2680);let n=!1;const s=x(this.expr.params[0]).evaluate(e,t);switch(s.type){case"ARRAY":break;case"NULL":n=!0;break;default:return f.mr()}const i=x(this.expr.params[1]).evaluate(e,t);switch(i.type){case"ARRAY":break;case"NULL":n=!0;break;default:return f.mr()}if(n)return f.gr();const a=((c=(u=i.value)==null?void 0:u.arrayValue)==null?void 0:c.values)??[],o=((h=(l=s.value)==null?void 0:l.arrayValue)==null?void 0:h.values)??[];for(const d of o)for(const _ of a)switch(be(d)&&be(_)?"EQ":st(d,_)){case"EQ":return f.newValue(Ae);case"NOT_EQ":case"TYPE_MISMATCH":break;case"NULL":n=!0;break;default:V(60403,{value:d,search:_})}return n?f.gr():f.newValue(ae)}}class im{constructor(e){this.expr=e}evaluate(e,t){var s,i,a;E(this.expr.params.length===1,38605);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return f.gr();case"ARRAY":return f.newValue({integerValue:`${((a=(i=(s=n.value)==null?void 0:s.arrayValue)==null?void 0:i.values)==null?void 0:a.length)??0}`});default:return f.mr()}}}class am{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class om{constructor(e){this.expr=e}evaluate(e,t){var s,i;E(this.expr.params.length===1,1508);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return f.gr();case"BYTES":{const a=(s=n.value)==null?void 0:s.bytesValue;if(typeof a=="string"){const o=Q.fromBase64String(a).toUint8Array();return o.reverse(),f.newValue({bytesValue:Q.fromUint8Array(o).toBase64()})}return f.newValue({bytesValue:new Uint8Array(a).reverse()})}case"STRING":{const a=(i=n.value)==null?void 0:i.stringValue,o=new Intl.__PRIVATE_Segmenter(void 0,{granularity:"grapheme"}).segment(a),u=Array.from(o,(c=>c.segment)).reverse();return f.newValue({stringValue:u.join("")})}default:return f.mr()}}}class um{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class cm{constructor(e){this.expr=e}evaluate(e,t){throw new Error("Unimplemented")}}class lm{constructor(e){this.expr=e}evaluate(e,t){E(this.expr.params.length===1,19400);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"NULL":return f.gr();case"STRING":{const s=(function(a){let o=0;for(let u=0;u<a.length;u++){const c=a.codePointAt(u);if(c===void 0)return;if(c<=65535)if(c>=55296&&c<=57343)if(c<=56319){const l=a.codePointAt(u+1);l!==void 0&&l>=56320&&l<=57343?(o+=1,u++):o+=1}else o+=1;else o+=1;else{if(!(c<=1114111))return;o+=1,u++}}return o})(n.value.stringValue);return s===void 0?f.mr():f.newValue({integerValue:s})}default:return f.mr()}}}class hm{constructor(e){this.expr=e}evaluate(e,t){var s,i;E(this.expr.params.length===1,8486);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"BYTES":{const a=(s=n.value)==null?void 0:s.bytesValue;return typeof a=="string"?f.newValue({integerValue:Q.fromBase64String(a).toUint8Array().length}):f.newValue({integerValue:new Uint8Array(a).length})}case"STRING":{const a=(function(u){let c=0;for(let l=0;l<u.length;l++){const h=u.codePointAt(l);if(h===void 0)return;if(h>=55296&&h<=57343){if(!(h<=56319))return;{const d=u.codePointAt(l+1);if(d===void 0||!(d>=56320&&d<=57343))return;c+=4,l++}}else if(h<=127)c+=1;else if(h<=2047)c+=2;else if(h<=65535)c+=3;else{if(!(h<=1114111))return;c+=4,l++}}return c})((i=n.value)==null?void 0:i.stringValue);return a===void 0?f.mr():f.newValue({integerValue:a})}case"NULL":return f.gr();default:return f.mr()}}}class Hn{constructor(e){this.expr=e}evaluate(e,t){var a,o;E(this.expr.params.length===2,39773,`${this.expr.name}() function should have exactly two parameters`);let n=!1;const s=x(this.expr.params[0]).evaluate(e,t);switch(s.type){case"STRING":break;case"NULL":n=!0;break;default:return f.mr()}const i=x(this.expr.params[1]).evaluate(e,t);switch(i.type){case"STRING":break;case"NULL":n=!0;break;default:return f.mr()}return n?f.gr():this.Or((a=s.value)==null?void 0:a.stringValue,(o=i.value)==null?void 0:o.stringValue)}}class dm extends Hn{Or(e,t){try{const n=(function(a){let o="";for(let u=0;u<a.length;u++){const c=a.charAt(u);switch(c){case"_":o+=".";break;case"%":o+=".*";break;case"\\":case".":case"*":case"?":case"+":case"^":case"$":case"|":case"(":case")":case"[":case"]":case"{":case"}":o+="\\"+c;break;default:o+=c}}return"^"+o+"$"})(t),s=ea.compile(n);return f.newValue({booleanValue:s.matches(e)})}catch(n){return Oe(`Invalid LIKE pattern converted to regex: ${t}, returning error. Error: ${n}`),f.mr()}}}class fm extends Hn{Or(e,t){try{const n=ea.compile(t);return f.newValue({booleanValue:n.test(e)})}catch{return Oe(`Invalid regex pattern found in regex_contains: ${t}, returning error`),f.mr()}}}class mm extends Hn{Or(e,t){try{return f.newValue({booleanValue:ea.compile(t).matches(e)})}catch{return Oe(`Invalid regex pattern found in regex_match: ${t}, returning error`),f.mr()}}}class _m extends Hn{Or(e,t){return f.newValue({booleanValue:e.includes(t)})}}class pm extends Hn{Or(e,t){return f.newValue({booleanValue:e.startsWith(t)})}}class gm extends Hn{Or(e,t){return f.newValue({booleanValue:e.endsWith(t)})}}class ym{constructor(e){this.expr=e}evaluate(e,t){var s,i;E(this.expr.params.length===1,29079);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return f.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toLowerCase()});case"NULL":return f.gr();default:return f.mr()}}}class Im{constructor(e){this.expr=e}evaluate(e,t){var s,i;E(this.expr.params.length===1,60487);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return f.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.toUpperCase()});case"NULL":return f.gr();default:return f.mr()}}}class Tm{constructor(e){this.expr=e}evaluate(e,t){var s,i;E(this.expr.params.length===1,28544);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"STRING":return f.newValue({stringValue:(i=(s=n.value)==null?void 0:s.stringValue)==null?void 0:i.trim()});case"NULL":return f.gr();default:return f.mr()}}}class Em{constructor(e){this.expr=e}evaluate(e,t){const n=this.expr.params.map((a=>x(a).evaluate(e,t)));let s="",i=!1;for(const a of n)switch(a.type){case"STRING":s+=a.value.stringValue;break;case"NULL":i=!0;break;default:return f.mr()}return i?f.gr():f.newValue({stringValue:s})}}class wm{constructor(e){this.expr=e}evaluate(e,t){var a,o,u,c;E(this.expr.params.length===2,4483);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"UNSET":return f.pr();case"MAP":break;default:return f.mr()}const s=x(this.expr.params[1]).evaluate(e,t);if(s.type!=="STRING")return f.mr();const i=(c=(o=(a=n.value)==null?void 0:a.mapValue)==null?void 0:o.fields)==null?void 0:c[(u=s.value)==null?void 0:u.stringValue];return i===void 0?f.pr():f.newValue(i)}}class Na{constructor(e){this.expr=e}evaluate(e,t){var c,l;E(this.expr.params.length===2,25231,`${this.expr.name}() function should have exactly 2 params`);let n=!1;const s=x(this.expr.params[0]).evaluate(e,t);switch(s.type){case"VECTOR":break;case"NULL":n=!0;break;default:return f.mr()}const i=x(this.expr.params[1]).evaluate(e,t);switch(i.type){case"VECTOR":break;case"NULL":n=!0;break;default:return f.mr()}if(n)return f.gr();const a=Pi(s.value),o=Pi(i.value);if(a===void 0||o===void 0||((c=a.values)==null?void 0:c.length)!==((l=o.values)==null?void 0:l.length))return f.mr();const u=this.Mr(a,o);return u===void 0||isNaN(u)?f.mr():f.newValue({doubleValue:u})}}class Am extends Na{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return;let i=0,a=0,o=0;for(let c=0;c<n.length;c++){if(!Tt(n[c])||!Tt(s[c]))return;const l=ce(n[c]),h=ce(s[c]);i+=l*h,a+=l*l,o+=h*h}const u=Math.sqrt(a)*Math.sqrt(o);if(u!==0)return 1-Math.max(-1,Math.min(1,i/u))}}class Vm extends Na{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let a=0;a<n.length;a++){if(!Tt(n[a])||!Tt(s[a]))return;i+=ce(n[a])*ce(s[a])}return i}}class vm extends Na{Mr(e,t){const n=(e==null?void 0:e.values)??[],s=(t==null?void 0:t.values)??[];if(n.length===0)return 0;let i=0;for(let a=0;a<n.length;a++){if(!Tt(n[a])||!Tt(s[a]))return;const o=ce(n[a]),u=ce(s[a]);i+=Math.pow(o-u,2)}return Math.sqrt(i)}}class Rm{constructor(e){this.expr=e}evaluate(e,t){var s;E(this.expr.params.length===1,39044);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"VECTOR":{const i=Pi(n.value);return f.newValue({integerValue:((s=i==null?void 0:i.values)==null?void 0:s.length)??0})}case"NULL":return f.gr();default:return f.mr()}}}const Pr=BigInt(-62135596800),br=BigInt(253402300799),bs=BigInt(1e3),yt=BigInt(1e6),Pm=Pr*bs,bm=br*bs+BigInt(999),xm=Pr*yt,Sm=br*yt+BigInt(999999);function ka(r){return r>=xm&&r<=Sm}function Tl(r){return r>=Pr&&r<=br}function xr(r,e){const t=BigInt(r);return!(t<Pr||t>br)&&!(e<0||e>=1e9)&&(t!==Pr||e===0)&&!(t===br&&e>999999999)}function El(r,e){return e<0?{seconds:r-1,nanos:e+1e9}:{seconds:r,nanos:e}}function La(r){return BigInt(r.seconds)*yt+BigInt(Math.trunc(r.nanoseconds/1e3))}class Oa{constructor(e){this.expr=e}evaluate(e,t){E(this.expr.params.length===1,49262,`${this.expr.name}() function should have exactly one parameter`);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"INT":return this.toTimestamp(BigInt(n.value.integerValue));case"NULL":return f.gr();default:return f.mr()}}}class Cm extends Oa{toTimestamp(e){if(!ka(e))return f.mr();let t=Number(e/yt),n=Number(e%yt*BigInt(1e3));const s=El(t,n);return t=s.seconds,n=s.nanos,xr(t,n)?f.newValue({timestampValue:{seconds:t,nanos:n}}):f.mr()}}class Dm extends Oa{toTimestamp(e){if(!(function(a){return a>=Pm&&a<=bm})(e))return f.mr();let t=Number(e/bs),n=Number(e%bs*BigInt(1e6));const s=El(t,n);return t=s.seconds,n=s.nanos,xr(t,n)?f.newValue({timestampValue:{seconds:t,nanos:n}}):f.mr()}}class Nm extends Oa{toTimestamp(e){if(!Tl(e))return f.mr();const t=Number(e);return f.newValue({timestampValue:{seconds:t,nanos:0}})}}class Ma{constructor(e){this.expr=e}evaluate(e,t){E(this.expr.params.length===1,1265,`${this.expr.name}() function should have exactly one parameter`);const n=x(this.expr.params[0]).evaluate(e,t);switch(n.type){case"TIMESTAMP":break;case"NULL":return f.gr();default:return f.mr()}const s=ga(n.value.timestampValue);return xr(s.seconds,s.nanoseconds)?this.Nr(s):f.mr()}}class km extends Ma{Nr(e){const t=La(e);return ka(t)?f.newValue({integerValue:`${t.toString()}`}):f.mr()}}class Lm extends Ma{Nr(e){const t=La(e),n=t/BigInt(1e3),s=t%BigInt(1e3);return n>BigInt(0)||s===BigInt(0)?f.newValue({integerValue:n.toString()}):f.newValue({integerValue:(n-BigInt(1)).toString()})}}class Om extends Ma{Nr(e){const t=BigInt(e.seconds);return Tl(t)?f.newValue({integerValue:t.toString()}):f.mr()}}class wl{constructor(e){this.expr=e}evaluate(e,t){E(this.expr.params.length===3,2775,`${this.expr.name}() function should have exactly 3 parameters`);let n=!1;const s=x(this.expr.params[0]).evaluate(e,t);switch(s.type){case"TIMESTAMP":break;case"NULL":n=!0;break;default:return f.mr()}const i=x(this.expr.params[1]).evaluate(e,t);let a;switch(i.type){case"STRING":if(a=(function(k){switch(k){case"microsecond":return"microsecond";case"millisecond":return"millisecond";case"second":return"second";case"minute":return"minute";case"hour":return"hour";case"day":return"day";default:return}})(i.value.stringValue),a===void 0)return f.mr();break;case"NULL":n=!0;break;default:return f.mr()}const o=x(this.expr.params[2]).evaluate(e,t);switch(o.type){case"INT":break;case"NULL":n=!0;break;default:return f.mr()}if(n)return f.gr();const u=BigInt(o.value.integerValue);let c;try{switch(a){case"microsecond":c=u;break;case"millisecond":c=u*BigInt(1e3);break;case"second":c=u*BigInt(1e6);break;case"minute":c=u*BigInt(6e7);break;case"hour":c=u*BigInt(36e8);break;case"day":c=u*BigInt(864e8);break;default:return f.mr()}if(a!=="microsecond"&&u!==BigInt(0)&&c/u!==BigInt(this.Lr(a)))return f.mr()}catch(N){return Oe(`Error during timestamp arithmetic: ${N}`),f.mr()}const l=ga(s.value.timestampValue);if(!xr(l.seconds,l.nanoseconds))return f.mr();const h=La(l),d=this.Br(h,c);if(!ka(d))return f.mr();const _=Number(d/yt),y=d%yt,v=Number((y<0?y+yt:y)*BigInt(1e3)),R=y<0?_-1:_;return xr(R,v)?f.newValue({timestampValue:{seconds:R,nanos:v}}):f.mr()}Lr(e){switch(e){case"millisecond":return 1e3;case"second":return 1e6;case"minute":return 6e7;case"hour":return 36e8;case"day":return 864e8;default:return 1}}}class Mm extends wl{Br(e,t){return e+t}}class Fm extends wl{Br(e,t){return e-t}}function Sr(r){if((r=yl(r))instanceof sn)return`fld(${r.fieldName})`;if(r instanceof an)return`cst(${(function(t){return t===null?"null":typeof t=="number"?t.toString():typeof t=="string"?`"${t}"`:t instanceof z?`ref(${t.path})`:t instanceof Ee?`vec(${JSON.stringify(t)})`:JSON.stringify(t)})(r.value)})`;if(r instanceof g)return`fn(${r.name},[${r.params.map(Sr).join(",")}])`;if(r.expressionType==="ListOfExpressions")return`list([${r.cr.map(Sr).join(",")}])`;throw new Error(`Unrecognized expr ${JSON.stringify(r,null,2)}`)}function Um(r){if(r instanceof ml)return`${r._name}(${ns(r.fields)})`;if(r instanceof _l){let e=`${r._name}(${ns(r.accumulators)})`;return r.groups.size>0&&(e+=`grouping(${ns(r.groups)})`),e}if(r instanceof pl)return`${r._name}(${ns(r.groups)})`;if(r instanceof Kr)return`${r._name}(${r.hr})`;if(r instanceof Qr)return`${r._name}(${r.collectionId})`;if(r instanceof Ys)return`${r._name}()`;if(r instanceof Js)return`${r._name}(${r.Tr.sort()})`;if(r instanceof jr)return`${r._name}(${Sr(r.condition)})`;if(r instanceof vt)return`${r._name}(${r.limit})`;if(r instanceof qe)return`${r._name}(${(function(t){return t.map((n=>`${Sr(n.expr)}${n.direction}`)).join(",")})(r.orderings)})`;throw new Error(`Unrecognized stage ${r._name}`)}function ns(r){return`${Array.from(r.entries()).sort().map((([e,t])=>`${e}=${Sr(t)}`)).join(",")}`}function et(r){return r.stages.map((e=>Um(e))).join("|")}function Al(r,e){return et(r)===et(e)}function W(r){return r instanceof fe}function uu(r){return W(r)?et(r):lr(r)}function Vl(r){return W(r)?et(r):(function(t){return`${As(xe(t))}|lt:${t.limitType}`})(r)}function Zs(r,e){return r instanceof fe&&e instanceof fe?Al(r,e):!(r instanceof fe&&!(e instanceof fe)||!(r instanceof fe)&&e instanceof fe)&&gd(r,e)}function ei(r){return Je(r)?et(r):As(r)}function Fa(r,e){return r instanceof fe&&e instanceof fe?Al(r,e):!(r instanceof fe&&!(e instanceof fe)||!(r instanceof fe)&&e instanceof fe)&&ha(r,e)}function Bm(r,e){const t=(function(s){let i=!1;const a=[];for(const o of s)if(o instanceof qe)if(i=!0,o.orderings.some((u=>u.expr instanceof sn&&u.expr.fieldName===Ue)))a.push(o);else{const u=o.orderings.map((c=>c));u.push(ds(Ue).ascending()),a.push(new qe(u,{}))}else o instanceof vt&&(i||(a.push(new qe([ds(Ue).ascending()],{})),i=!0)),a.push(o);return i||a.push(new qe([ds(Ue).ascending()],{})),a})(r.stages);if(r.userDataReader){const n=r.userDataReader.createContext(3,"toCorePipeline");t.forEach((s=>s._readUserData(n)))}return new fe(r.userDataReader.serializer,t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ua{constructor(e,t,n,s){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=s}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let s=0;s<this.mutations.length;s++){const i=this.mutations[s];i.key.isEqual(e.key)&&rd(i,e,n[s])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=cr(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=cr(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=Sc();return this.mutations.forEach((s=>{const i=e.get(s.key),a=i.overlayedDocument;let o=this.applyToLocalView(a,i.mutatedFields);o=t.has(s.key)?null:o;const u=mc(a,o);u!==null&&n.set(s.key,u),a.isValidDocument()||a.convertToNoDocument(b.min())})),n}keys(){return this.mutations.reduce(((e,t)=>e.add(t.key)),C())}isEqual(e){return this.batchId===e.batchId&&Vn(this.mutations,e.mutations,((t,n)=>Mo(t,n)))&&Vn(this.baseMutations,e.baseMutations,((t,n)=>Mo(t,n)))}}class Ba{constructor(e,t,n,s){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=s}static from(e,t,n){E(e.mutations.length===n.length,58842,{Ur:e.mutations.length,kr:n.length});let s=(function(){return Ed})();const i=e.mutations;for(let a=0;a<i.length;a++)s=s.insert(i[a].key,n[a].version);return new Ba(e,t,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xs="";function me(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=cu(e)),e=qm(r.get(t),e);return cu(e)}function qm(r,e){let t=e;const n=r.length;for(let s=0;s<n;s++){const i=r.charAt(s);switch(i){case"\0":t+="";break;case xs:t+="";break;default:t+=i}}return t}function cu(r){return r+xs+""}function $e(r){const e=r.length;if(E(e>=2,64408,{path:r}),e===2)return E(r.charAt(0)===xs&&r.charAt(1)==="",56145,{path:r}),D.emptyPath();const t=e-2,n=[];let s="";for(let i=0;i<e;){const a=r.indexOf(xs,i);switch((a<0||a>t)&&V(50515,{path:r}),r.charAt(a+1)){case"":const o=r.substring(i,a);let u;s.length===0?u=o:(s+=o,u=s,s=""),n.push(u);break;case"":s+=r.substring(i,a),s+="\0";break;case"":s+=r.substring(i,a+1);break;default:V(61167,{path:r})}i=a+2}return new D(n)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kt="remoteDocuments",Yr="owner",ln="owner",Cr="mutationQueues",$m="userId",ke="mutations",lu="batchId",qt="userMutationsIndex",hu=["userId","batchId"];/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fs(r,e){return[r,me(e)]}function vl(r,e,t){return[r,me(e),t]}const zm={},Ln="documentMutations",Ss="remoteDocumentsV14",Gm=["prefixPath","collectionGroup","readTime","documentId"],ms="documentKeyIndex",Km=["prefixPath","collectionGroup","documentId"],Rl="collectionGroupIndex",Qm=["collectionGroup","readTime","prefixPath","documentId"],Dr="remoteDocumentGlobal",Fi="remoteDocumentGlobalKey",On="targets",Pl="queryTargetsIndex",jm=["canonicalId","targetId"],Mn="targetDocuments",Wm=["targetId","path"],qa="documentTargetsIndex",Hm=["path","targetId"],Cs="targetGlobalKey",Qt="targetGlobal",Nr="collectionParents",Ym=["collectionId","parent"],Fn="clientMetadata",Jm="clientId",ti="bundles",Xm="bundleId",ni="namedQueries",Zm="name",$a="indexConfiguration",e_="indexId",Ui="collectionGroupIndex",t_="collectionGroup",_r="indexState",n_=["indexId","uid"],bl="sequenceNumberIndex",r_=["uid","sequenceNumber"],pr="indexEntries",s_=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],xl="documentKeyIndex",i_=["indexId","uid","orderedDocumentKey"],ri="documentOverlays",a_=["userId","collectionPath","documentId"],Bi="collectionPathOverlayIndex",o_=["userId","collectionPath","largestBatchId"],Sl="collectionGroupOverlayIndex",u_=["userId","collectionGroup","largestBatchId"],za="globals",c_="name",Cl=[Cr,ke,Ln,kt,On,Yr,Qt,Mn,Fn,Dr,Nr,ti,ni],l_=[...Cl,ri],Dl=[Cr,ke,Ln,Ss,On,Yr,Qt,Mn,Fn,Dr,Nr,ti,ni,ri],Nl=Dl,Ga=[...Nl,$a,_r,pr],h_=Ga,kl=[...Ga,za],d_=kl;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ll(r,e,t){const n=r.store(ke),s=r.store(Ln),i=[],a=IDBKeyRange.only(t.batchId);let o=0;const u=n.Hn({range:a},((l,h,d)=>(o++,d.delete())));i.push(u.next((()=>{E(o===1,47070,{batchId:t.batchId})})));const c=[];for(const l of t.mutations){const h=vl(e,l.key.path,t.batchId);i.push(s.delete(h)),c.push(l.key)}return m.waitFor(i).next((()=>c))}function Ds(r){if(!r)return 0;let e;if(r.document)e=r.document;else if(r.unknownDocument)e=r.unknownDocument;else{if(!r.noDocument)throw V(14731);e=r.noDocument}return JSON.stringify(e).length}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qi extends Jc{constructor(e,t){super(),this.qr=e,this.currentSequenceNumber=t}}function ne(r,e){const t=P(r);return pt.Cn(t.qr,e)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ka{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ze{constructor(e,t,n,s,i=b.min(),a=b.min(),o=Q.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=s,this.snapshotVersion=i,this.lastLimboFreeSnapshotVersion=a,this.resumeToken=o,this.expectedCount=u}withSequenceNumber(e){return new ze(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new ze(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new ze(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new ze(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ol{constructor(e){this.$r=e}}function f_(r,e){let t;if(e.document)t=Cd(r.$r,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const n=A.fromSegments(e.noDocument.path),s=tn(e.noDocument.readTime);t=K.newNoDocument(n,s),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return V(56709);{const n=A.fromSegments(e.unknownDocument.path),s=tn(e.unknownDocument.version);t=K.newUnknownDocument(n,s)}}return e.readTime&&t.setReadTime((function(s){const i=new F(s[0],s[1]);return b.fromTimestamp(i)})(e.readTime)),t}function du(r,e){const t=e.key,n={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:Ns(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())n.document=(function(i,a){return{name:kn(i,a.key),fields:a.data.value.mapValue.fields,updateTime:Kt(i,a.version.toTimestamp()),createTime:Kt(i,a.createTime.toTimestamp())}})(r.$r,e);else if(e.isNoDocument())n.noDocument={path:t.path.toArray(),readTime:en(e.version)};else{if(!e.isUnknownDocument())return V(57904,{document:e});n.unknownDocument={path:t.path.toArray(),version:en(e.version)}}return n}function Ns(r){const e=r.toTimestamp();return[e.seconds,e.nanoseconds]}function en(r){const e=r.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function tn(r){const e=new F(r.seconds,r.nanoseconds);return b.fromTimestamp(e)}function Mt(r,e){const t=(e.baseMutations||[]).map((i=>Oi(r.$r,i)));for(let i=0;i<e.mutations.length-1;++i){const a=e.mutations[i];if(i+1<e.mutations.length&&e.mutations[i+1].transform!==void 0){const o=e.mutations[i+1];a.updateTransforms=o.transform.fieldTransforms,e.mutations.splice(i+1,1),++i}}const n=e.mutations.map((i=>Oi(r.$r,i))),s=F.fromMillis(e.localWriteTimeMs);return new Ua(e.batchId,s,t,n)}function or(r,e){const t=tn(e.readTime),n=e.lastLimboFreeSnapshotVersion!==void 0?tn(e.lastLimboFreeSnapshotVersion):b.min();let s;return s=(function(a){return a.structuredPipeline!==void 0})(e.query)?(function(a,o){var l,h;const u=a.structuredPipeline;E((((l=u==null?void 0:u.pipeline)==null?void 0:l.stages)??[]).length>0,1845);const c=(h=u==null?void 0:u.pipeline)==null?void 0:h.stages.map(m_);return new fe(o,c)})(e.query,r.$r):(function(a){return a.documents!==void 0})(e.query)?(function(a){const o=a.documents.length;return E(o===1,1966,{count:o}),xe(zr(Oc(a.documents[0])))})(e.query):(function(a){return xe(Bc(a))})(e.query),new ze(s,e.targetId,"TargetPurposeListen",e.lastListenSequenceNumber,t,n,Q.fromBase64String(e.resumeToken))}function Ml(r,e){const t=en(e.snapshotVersion),n=en(e.lastLimboFreeSnapshotVersion);let s;s=Je(e.target)?qc(r.$r,e.target):da(e.target)?Fc(r.$r,e.target):Uc(r.$r,e.target).Se;const i=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:ei(e.target),readTime:t,resumeToken:i,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:n,query:s}}function Fl(r){const e=Bc({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?vs(e,e.limit,"L"):e}function rs(r,e){return new Ka(e.largestBatchId,Oi(r.$r,e.overlayMutation))}function fu(r,e){const t=e.path.lastSegment();return[r,me(e.path.popLast()),t]}function mu(r,e,t,n){return{indexId:r,uid:e,sequenceNumber:t,readTime:en(n.readTime),documentKey:me(n.documentKey.path),largestBatchId:n.largestBatchId}}function m_(r){switch(r.name){case"collection":return new Kr(r.args[0].referenceValue,{});case"collection_group":return new Qr(r.args[1].stringValue,{});case"database":return new Ys({});case"documents":return new Js(r.args.map((e=>e.referenceValue)),{});case"where":return new jr($i(r.args[0]),{});case"limit":{const e=r.args[0].integerValue??r.args[0].doubleValue;return new vt(typeof e=="number"?e:Number(e),{})}case"sort":return new qe(r.args.map((e=>(function(n){var i,a;const s=(i=n.mapValue)==null?void 0:i.fields;return new xa($i(s.expression),(a=s.direction)==null?void 0:a.stringValue,"orderingFromProto")})(e))),{});default:throw new Error(`Stage type: ${r.name} not supported.`)}}function $i(r){return r.fieldReferenceValue?new sn(rt("_exprFromProto",r.fieldReferenceValue),"_exprFromProto"):r.functionValue?(function(t){var n;return new g(t.functionValue.name,((n=t.functionValue.args)==null?void 0:n.map($i))||[])})(r):an._fromProto(r)}class si{constructor(e,t,n,s){this.userId=e,this.serializer=t,this.indexManager=n,this.referenceDelegate=s,this.Kr={}}static Qr(e,t,n,s){E(e.uid!=="",64387);const i=e.isAuthenticated()?e.uid:"";return new si(i,t,n,s)}checkEmpty(e){let t=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return ct(e).Hn({index:qt,range:n},((s,i,a)=>{t=!1,a.done()})).next((()=>t))}addMutationBatch(e,t,n,s){const i=Tn(e),a=ct(e);return a.add({}).next((o=>{E(typeof o=="number",49019);const u=new Ua(o,t,n,s),c=(function(_,y,v){const R=v.baseMutations.map((k=>Vr(_.$r,k))),N=v.mutations.map((k=>Vr(_.$r,k)));return{userId:y,batchId:v.batchId,localWriteTimeMs:v.localWriteTime.toMillis(),baseMutations:R,mutations:N}})(this.serializer,this.userId,u),l=[];let h=new U(((d,_)=>S(d.canonicalString(),_.canonicalString())));for(const d of s){const _=vl(this.userId,d.key.path,o);h=h.add(d.key.path.popLast()),l.push(a.put(c)),l.push(i.put(_,zm))}return h.forEach((d=>{l.push(this.indexManager.addToCollectionParentIndex(e,d))})),e.addOnCommittedListener((()=>{this.Kr[o]=u.keys()})),m.waitFor(l).next((()=>u))}))}lookupMutationBatch(e,t){return ct(e).get(t).next((n=>n?(E(n.userId===this.userId,48,"Unexpected user for mutation batch",{userId:n.userId,batchId:t}),Mt(this.serializer,n)):null))}Wr(e,t){return this.Kr[t]?m.resolve(this.Kr[t]):this.lookupMutationBatch(e,t).next((n=>{if(n){const s=n.keys();return this.Kr[t]=s,s}return null}))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=IDBKeyRange.lowerBound([this.userId,n]);let i=null;return ct(e).Hn({index:qt,range:s},((a,o,u)=>{o.userId===this.userId&&(E(o.batchId>=n,47524,{Gr:n}),i=Mt(this.serializer,o)),u.done()})).next((()=>i))}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=zt;return ct(e).Hn({index:qt,range:t,reverse:!0},((s,i,a)=>{n=i.batchId,a.done()})).next((()=>n))}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,zt],[this.userId,Number.POSITIVE_INFINITY]);return ct(e).Qn(qt,t).next((n=>n.map((s=>Mt(this.serializer,s)))))}getAllMutationBatchesAffectingDocumentKey(e,t){const n=fs(this.userId,t.path),s=IDBKeyRange.lowerBound(n),i=[];return Tn(e).Hn({range:s},((a,o,u)=>{const[c,l,h]=a,d=$e(l);if(c===this.userId&&t.path.isEqual(d))return ct(e).get(h).next((_=>{if(!_)throw V(61480,{zr:a,batchId:h});E(_.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:_.userId,batchId:h}),i.push(Mt(this.serializer,_))}));u.done()})).next((()=>i))}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new U(S);const s=[];return t.forEach((i=>{const a=fs(this.userId,i.path),o=IDBKeyRange.lowerBound(a),u=Tn(e).Hn({range:o},((c,l,h)=>{const[d,_,y]=c,v=$e(_);d===this.userId&&i.path.isEqual(v)?n=n.add(y):h.done()}));s.push(u)})),m.waitFor(s).next((()=>this.jr(e,n)))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1,i=fs(this.userId,n),a=IDBKeyRange.lowerBound(i);let o=new U(S);return Tn(e).Hn({range:a},((u,c,l)=>{const[h,d,_]=u,y=$e(d);h===this.userId&&n.isPrefixOf(y)?y.length===s&&(o=o.add(_)):l.done()})).next((()=>this.jr(e,o)))}jr(e,t){const n=[],s=[];return t.forEach((i=>{s.push(ct(e).get(i).next((a=>{if(a===null)throw V(35274,{batchId:i});E(a.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:a.userId,batchId:i}),n.push(Mt(this.serializer,a))})))})),m.waitFor(s).next((()=>n))}removeMutationBatch(e,t){return Ll(e.qr,this.userId,t).next((n=>(e.addOnCommittedListener((()=>{this.Hr(t.batchId)})),m.forEach(n,(s=>this.referenceDelegate.markPotentiallyOrphaned(e,s))))))}Hr(e){delete this.Kr[e]}performConsistencyCheck(e){return this.checkEmpty(e).next((t=>{if(!t)return m.resolve();const n=IDBKeyRange.lowerBound((function(a){return[a]})(this.userId)),s=[];return Tn(e).Hn({range:n},((i,a,o)=>{if(i[0]===this.userId){const u=$e(i[1]);s.push(u)}else o.done()})).next((()=>{E(s.length===0,56720,{Jr:s.map((i=>i.canonicalString()))})}))}))}containsKey(e,t){return Ul(e,this.userId,t)}Yr(e){return Bl(e).get(this.userId).next((t=>t||{userId:this.userId,lastAcknowledgedBatchId:zt,lastStreamToken:""}))}}function Ul(r,e,t){const n=fs(e,t.path),s=n[1],i=IDBKeyRange.lowerBound(n);let a=!1;return Tn(r).Hn({range:i,jn:!0},((o,u,c)=>{const[l,h,d]=o;l===e&&h===s&&(a=!0),c.done()})).next((()=>a))}function ct(r){return ne(r,ke)}function Tn(r){return ne(r,Ln)}function Bl(r){return ne(r,Cr)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class __{getBundleMetadata(e,t){return _u(e).get(t).next((n=>{if(n)return(function(i){return{id:i.bundleId,createTime:tn(i.createTime),version:i.version}})(n)}))}saveBundleMetadata(e,t){return _u(e).put((function(s){return{bundleId:s.id,createTime:en(oe(s.createTime)),version:s.version}})(t))}getNamedQuery(e,t){return pu(e).get(t).next((n=>{if(n)return(function(i){return{name:i.name,query:Fl(i.bundledQuery),readTime:tn(i.readTime)}})(n)}))}saveNamedQuery(e,t){return pu(e).put((function(s){return{name:s.name,readTime:en(oe(s.readTime)),bundledQuery:s.bundledQuery}})(t))}}function _u(r){return ne(r,ti)}function pu(r){return ne(r,ni)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ii{constructor(e,t){this.serializer=e,this.userId=t}static Qr(e,t){const n=t.uid||"";return new ii(e,n)}getOverlay(e,t){return hn(e).get(fu(this.userId,t)).next((n=>n?rs(this.serializer,n):null))}getOverlays(e,t){const n=De();return m.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}getAllOverlays(e,t){const n=De();return hn(e).Hn(((s,i)=>{const a=rs(this.serializer,i);a.largestBatchId>t&&n.set(a.getKey(),a)})).next((()=>n))}saveOverlays(e,t,n){const s=[];return n.forEach(((i,a)=>{const o=new Ka(t,a);s.push(this.Zr(e,o))})),m.waitFor(s)}removeOverlaysForBatchId(e,t,n){const s=new Set;t.forEach((a=>s.add(me(a.getCollectionPath()))));const i=[];return s.forEach((a=>{const o=IDBKeyRange.bound([this.userId,a,n],[this.userId,a,n+1],!1,!0);i.push(hn(e).zn(Bi,o))})),m.waitFor(i)}getOverlaysForCollection(e,t,n){const s=De(),i=me(t),a=IDBKeyRange.bound([this.userId,i,n],[this.userId,i,Number.POSITIVE_INFINITY],!0);return hn(e).Qn(Bi,a).next((o=>{for(const u of o){const c=rs(this.serializer,u);s.set(c.getKey(),c)}return s}))}getOverlaysForCollectionGroup(e,t,n,s){const i=De();let a;const o=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,Number.POSITIVE_INFINITY],!0);return hn(e).Hn({index:Sl,range:o},((u,c,l)=>{const h=rs(this.serializer,c);i.size()<s||h.largestBatchId===a?(i.set(h.getKey(),h),a=h.largestBatchId):l.done()})).next((()=>i))}Zr(e,t){return hn(e).put((function(s,i,a){const[o,u,c]=fu(i,a.mutation.key);return{userId:i,collectionPath:u,documentId:c,collectionGroup:a.mutation.key.getCollectionGroup(),largestBatchId:a.largestBatchId,overlayMutation:Vr(s.$r,a.mutation)}})(this.serializer,this.userId,t))}}function hn(r){return ne(r,ri)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class p_{Xr(e){return ne(e,za)}getSessionToken(e){return this.Xr(e).get("sessionToken").next((t=>{const n=t==null?void 0:t.value;return n?Q.fromUint8Array(n):Q.EMPTY_BYTE_STRING}))}setSessionToken(e,t){return this.Xr(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ft{constructor(){}ei(e,t){this.ti(e,t),t.ni()}ti(e,t){if("nullValue"in e)this.ri(t,5);else if("booleanValue"in e)this.ri(t,10),t.ii(e.booleanValue?1:0);else if("integerValue"in e)this.ri(t,15),t.ii($(e.integerValue));else if("doubleValue"in e){const n=$(e.doubleValue);isNaN(n)?this.ri(t,13):(this.ri(t,15),Rn(n)?t.ii(0):t.ii(n))}else if("timestampValue"in e){let n=e.timestampValue;this.ri(t,20),typeof n=="string"&&(n=tt(n)),t.si(`${n.seconds||""}`),t.ii(n.nanos||0)}else if("stringValue"in e)this._i(e.stringValue,t),this.oi(t);else if("bytesValue"in e)this.ri(t,30),t.ai(nt(e.bytesValue)),this.oi(t);else if("referenceValue"in e)this.ui(e.referenceValue,t);else if("geoPointValue"in e){const n=e.geoPointValue;this.ri(t,45),t.ii(n.latitude||0),t.ii(n.longitude||0)}else"mapValue"in e?ac(e)?this.ri(t,Number.MAX_SAFE_INTEGER):Zt(e)?this.ci(e.mapValue,t):(this.li(e.mapValue,t),this.oi(t)):"arrayValue"in e?(this.Ei(e.arrayValue,t),this.oi(t)):V(19022,{hi:e})}_i(e,t){this.ri(t,25),this.Ti(e,t)}Ti(e,t){t.si(e)}li(e,t){const n=e.fields||{};this.ri(t,55);for(const s of Object.keys(n))this._i(s,t),this.ti(n[s],t)}ci(e,t){var a,o;const n=e.fields||{};this.ri(t,53);const s=Jt,i=((o=(a=n[s].arrayValue)==null?void 0:a.values)==null?void 0:o.length)||0;this.ri(t,15),t.ii($(i)),this._i(s,t),this.ti(n[s],t)}Ei(e,t){const n=e.values||[];this.ri(t,50);for(const s of n)this.ti(s,t)}ui(e,t){this.ri(t,37),A.fromName(e).path.forEach((n=>{this.ri(t,60),this.Ti(n,t)}))}ri(e,t){e.ii(t)}oi(e){e.ii(2)}}Ft.Pi=new Ft;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dn=255;function g_(r){if(r===0)return 8;let e=0;return r>>4||(e+=4,r<<=4),r>>6||(e+=2,r<<=2),r>>7||(e+=1),e}function gu(r){const e=64-(function(n){let s=0;for(let i=0;i<8;++i){const a=g_(255&n[i]);if(s+=a,a!==8)break}return s})(r);return Math.ceil(e/8)}class y_{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Ii(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Ri(n.value),n=t.next();this.Ai()}Vi(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.di(n.value),n=t.next();this.fi()}mi(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Ri(n);else if(n<2048)this.Ri(960|n>>>6),this.Ri(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Ri(480|n>>>12),this.Ri(128|63&n>>>6),this.Ri(128|63&n);else{const s=t.codePointAt(0);this.Ri(240|s>>>18),this.Ri(128|63&s>>>12),this.Ri(128|63&s>>>6),this.Ri(128|63&s)}}this.Ai()}pi(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.di(n);else if(n<2048)this.di(960|n>>>6),this.di(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.di(480|n>>>12),this.di(128|63&n>>>6),this.di(128|63&n);else{const s=t.codePointAt(0);this.di(240|s>>>18),this.di(128|63&s>>>12),this.di(128|63&s>>>6),this.di(128|63&s)}}this.fi()}gi(e){const t=this.yi(e),n=gu(t);this.wi(1+n),this.buffer[this.position++]=255&n;for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=255&t[s]}bi(e){const t=this.yi(e),n=gu(t);this.wi(1+n),this.buffer[this.position++]=~(255&n);for(let s=t.length-n;s<t.length;++s)this.buffer[this.position++]=~(255&t[s])}Si(){this.Di(dn),this.Di(255)}xi(){this.Ci(dn),this.Ci(255)}reset(){this.position=0}seed(e){this.wi(e.length),this.buffer.set(e,this.position),this.position+=e.length}Fi(){return this.buffer.slice(0,this.position)}yi(e){const t=(function(i){const a=new DataView(new ArrayBuffer(8));return a.setFloat64(0,i,!1),new Uint8Array(a.buffer)})(e),n=!!(128&t[0]);t[0]^=n?255:128;for(let s=1;s<t.length;++s)t[s]^=n?255:0;return t}Ri(e){const t=255&e;t===0?(this.Di(0),this.Di(255)):t===dn?(this.Di(dn),this.Di(0)):this.Di(t)}di(e){const t=255&e;t===0?(this.Ci(0),this.Ci(255)):t===dn?(this.Ci(dn),this.Ci(0)):this.Ci(e)}Ai(){this.Di(0),this.Di(1)}fi(){this.Ci(0),this.Ci(1)}Di(e){this.wi(1),this.buffer[this.position++]=e}Ci(e){this.wi(1),this.buffer[this.position++]=~e}wi(e){const t=e+this.position;if(t<=this.buffer.length)return;let n=2*this.buffer.length;n<t&&(n=t);const s=new Uint8Array(n);s.set(this.buffer),this.buffer=s}}class I_{constructor(e){this.Oi=e}ai(e){this.Oi.Ii(e)}si(e){this.Oi.mi(e)}ii(e){this.Oi.gi(e)}ni(){this.Oi.Si()}}class T_{constructor(e){this.Oi=e}ai(e){this.Oi.Vi(e)}si(e){this.Oi.pi(e)}ii(e){this.Oi.bi(e)}ni(){this.Oi.xi()}}class tr{constructor(){this.Oi=new y_,this.ascending=new I_(this.Oi),this.descending=new T_(this.Oi)}seed(e){this.Oi.seed(e)}Mi(e){return e===0?this.ascending:this.descending}Fi(){return this.Oi.Fi()}reset(){this.Oi.reset()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ut{constructor(e,t,n,s){this.Ni=e,this.Li=t,this.Bi=n,this.Ui=s}ki(){const e=this.Ui.length,t=e===0||this.Ui[e-1]===255?e+1:e,n=new Uint8Array(t);return n.set(this.Ui,0),t!==e?n.set([0],this.Ui.length):++n[n.length-1],new Ut(this.Ni,this.Li,this.Bi,n)}qi(e,t,n){return{indexId:this.Ni,uid:e,arrayValue:_s(this.Bi),directionalValue:_s(this.Ui),orderedDocumentKey:_s(t),documentKey:n.path.toArray()}}$i(e,t,n){const s=this.qi(e,t,n);return[s.indexId,s.uid,s.arrayValue,s.directionalValue,s.orderedDocumentKey,s.documentKey]}}function lt(r,e){let t=r.Ni-e.Ni;return t!==0?t:(t=yu(r.Bi,e.Bi),t!==0?t:(t=yu(r.Ui,e.Ui),t!==0?t:A.comparator(r.Li,e.Li)))}function yu(r,e){for(let t=0;t<r.length&&t<e.length;++t){const n=r[t]-e[t];if(n!==0)return n}return r.length-e.length}function _s(r){return Wu()?(function(t){let n="";for(let s=0;s<t.length;s++)n+=String.fromCharCode(t[s]);return n})(r):r}function Iu(r){return typeof r!="string"?r:(function(t){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t.charCodeAt(s);return n})(r)}class Tu{constructor(e){this.Ki=new U(((t,n)=>te.comparator(t.field,n.field))),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.Qi=e.orderBy,this.Wi=[];for(const t of e.filters){const n=t;n.isInequality()?this.Ki=this.Ki.add(n):this.Wi.push(n)}}get Gi(){return this.Ki.size>1}zi(e){if(E(e.collectionGroup===this.collectionId,49279),this.Gi)return!1;const t=Si(e);if(t!==void 0&&!this.ji(t))return!1;const n=Nt(e);let s=new Set,i=0,a=0;for(;i<n.length&&this.ji(n[i]);++i)s=s.add(n[i].fieldPath.canonicalString());if(i===n.length)return!0;if(this.Ki.size>0){const o=this.Ki.getIterator().getNext();if(!s.has(o.field.canonicalString())){const u=n[i];if(!this.Hi(o,u)||!this.Ji(this.Qi[a++],u))return!1}++i}for(;i<n.length;++i){const o=n[i];if(a>=this.Qi.length||!this.Ji(this.Qi[a++],o))return!1}return!0}Yi(){if(this.Gi)return null;let e=new U(te.comparator);const t=[];for(const n of this.Wi)if(!n.field.isKeyField())if(n.op==="array-contains"||n.op==="array-contains-any")t.push(new cs(n.field,2));else{if(e.has(n.field))continue;e=e.add(n.field),t.push(new cs(n.field,0))}for(const n of this.Qi)n.field.isKeyField()||e.has(n.field)||(e=e.add(n.field),t.push(new cs(n.field,n.dir==="asc"?0:1)));return new ws(ws.UNKNOWN_ID,this.collectionId,t,Ar.empty())}ji(e){for(const t of this.Wi)if(this.Hi(t,e))return!0;return!1}Hi(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const n=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===n}Ji(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ql(r){var t,n;if(E(r instanceof O||r instanceof B,20012),r instanceof O){if(r instanceof wc){const s=((n=(t=r.value.arrayValue)==null?void 0:t.values)==null?void 0:n.map((i=>O.create(r.field,"==",i))))||[];return B.create(s,"or")}return r}const e=r.filters.map((s=>ql(s)));return B.create(e,r.op)}function E_(r){if(r.getFilters().length===0)return[];const e=Ki(ql(r));return E($l(e),7391),zi(e)||Gi(e)?[e]:e.getFilters()}function zi(r){return r instanceof O}function Gi(r){return r instanceof B&&ca(r)}function $l(r){return zi(r)||Gi(r)||(function(t){if(t instanceof B&&bi(t)){for(const n of t.getFilters())if(!zi(n)&&!Gi(n))return!1;return!0}return!1})(r)}function Ki(r){if(E(r instanceof O||r instanceof B,34018),r instanceof O)return r;if(r.filters.length===1)return Ki(r.filters[0]);const e=r.filters.map((n=>Ki(n)));let t=B.create(e,r.op);return t=ks(t),$l(t)?t:(E(t instanceof B,64498),E(Dn(t),40251),E(t.filters.length>1,57927),t.filters.reduce(((n,s)=>Qa(n,s))))}function Qa(r,e){let t;return E(r instanceof O||r instanceof B,38388),E(e instanceof O||e instanceof B,25473),t=r instanceof O?e instanceof O?(function(s,i){return B.create([s,i],"and")})(r,e):Eu(r,e):e instanceof O?Eu(e,r):(function(s,i){if(E(s.filters.length>0&&i.filters.length>0,48005),Dn(s)&&Dn(i))return Ic(s,i.getFilters());const a=bi(s)?s:i,o=bi(s)?i:s,u=a.filters.map((c=>Qa(c,o)));return B.create(u,"or")})(r,e),ks(t)}function Eu(r,e){if(Dn(e))return Ic(e,r.getFilters());{const t=e.filters.map((n=>Qa(r,n)));return B.create(t,"or")}}function ks(r){if(E(r instanceof O||r instanceof B,11850),r instanceof O)return r;const e=r.getFilters();if(e.length===1)return ks(e[0]);if(gc(r))return r;const t=e.map((s=>ks(s))),n=[];return t.forEach((s=>{s instanceof O?n.push(s):s instanceof B&&(s.op===r.op?n.push(...s.filters):n.push(s))})),n.length===1?n[0]:B.create(n,r.op)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class w_{constructor(){this.Zi=new ja}addToCollectionParentIndex(e,t){return this.Zi.add(t),m.resolve()}getCollectionParents(e,t){return m.resolve(this.Zi.getEntries(t))}addFieldIndex(e,t){return m.resolve()}deleteFieldIndex(e,t){return m.resolve()}deleteAllFieldIndexes(e){return m.resolve()}createTargetIndexes(e,t){return m.resolve()}getDocumentsMatchingTarget(e,t){return m.resolve(null)}getIndexType(e,t){return m.resolve(0)}getFieldIndexes(e,t){return m.resolve([])}getNextCollectionGroupToUpdate(e){return m.resolve(null)}getMinOffset(e,t){return m.resolve(Se.min())}getMinOffsetFromCollectionGroup(e,t){return m.resolve(Se.min())}updateCollectionGroup(e,t,n){return m.resolve()}updateIndexEntries(e,t){return m.resolve()}}class ja{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t]||new U(D.comparator),i=!s.has(n);return this.index[t]=s.add(n),i}has(e){const t=e.lastSegment(),n=e.popLast(),s=this.index[t];return s&&s.has(n)}getEntries(e){return(this.index[e]||new U(D.comparator)).toArray()}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wu="IndexedDbIndexManager",ss=new Uint8Array(0);class A_{constructor(e,t){this.databaseId=t,this.Xi=new ja,this.es=new ot((n=>As(n)),((n,s)=>ha(n,s))),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.Xi.has(t)){const n=t.lastSegment(),s=t.popLast();e.addOnCommittedListener((()=>{this.Xi.add(t)}));const i={collectionId:n,parent:me(s)};return Au(e).put(i)}return m.resolve()}getCollectionParents(e,t){const n=[],s=IDBKeyRange.bound([t,""],[Yu(t),""],!1,!0);return Au(e).Qn(s).next((i=>{for(const a of i){if(a.collectionId!==t)break;n.push($e(a.parent))}return n}))}addFieldIndex(e,t){const n=nr(e),s=(function(o){return{indexId:o.indexId,collectionGroup:o.collectionGroup,fields:o.fields.map((u=>[u.fieldPath.canonicalString(),u.kind]))}})(t);delete s.indexId;const i=n.add(s);if(t.indexState){const a=mn(e);return i.next((o=>{a.put(mu(o,this.uid,t.indexState.sequenceNumber,t.indexState.offset))}))}return i.next()}deleteFieldIndex(e,t){const n=nr(e),s=mn(e),i=fn(e);return n.delete(t.indexId).next((()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))).next((()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))))}deleteAllFieldIndexes(e){const t=nr(e),n=fn(e),s=mn(e);return t.zn().next((()=>n.zn())).next((()=>s.zn()))}createTargetIndexes(e,t){return m.forEach(this.ts(t),(n=>this.getIndexType(e,n).next((s=>{if(s===0||s===1){const i=new Tu(n).Yi();if(i!=null)return this.addFieldIndex(e,i)}}))))}getDocumentsMatchingTarget(e,t){const n=fn(e);let s=!0;const i=new Map;return m.forEach(this.ts(t),(a=>this.ns(e,a).next((o=>{s&&(s=!!o),i.set(a,o)})))).next((()=>{if(s){let a=C();const o=[];return m.forEach(i,((u,c)=>{T(wu,`Using index ${(function(L){return`id=${L.indexId}|cg=${L.collectionGroup}|f=${L.fields.map((re=>`${re.fieldPath}:${re.kind}`)).join(",")}`})(u)} to execute ${As(t)}`);const l=(function(L,re){const G=Si(re);if(G===void 0)return null;for(const Z of Vs(L,G.fieldPath))switch(Z.op){case"array-contains-any":return Z.value.arrayValue.values||[];case"array-contains":return[Z.value]}return null})(c,u),h=(function(L,re){const G=new Map;for(const Z of Nt(re))for(const ge of Vs(L,Z.fieldPath))switch(ge.op){case"==":case"in":G.set(Z.fieldPath.canonicalString(),ge.value);break;case"not-in":case"!=":return G.set(Z.fieldPath.canonicalString(),ge.value),Array.from(G.values())}return null})(c,u),d=(function(L,re){const G=[];let Z=!0;for(const ge of Nt(re)){const ut=ge.kind===0?$o(L,ge.fieldPath,L.startAt):zo(L,ge.fieldPath,L.startAt);G.push(ut.value),Z&&(Z=ut.inclusive)}return new wt(G,Z)})(c,u),_=(function(L,re){const G=[];let Z=!0;for(const ge of Nt(re)){const ut=ge.kind===0?zo(L,ge.fieldPath,L.endAt):$o(L,ge.fieldPath,L.endAt);G.push(ut.value),Z&&(Z=ut.inclusive)}return new wt(G,Z)})(c,u),y=this.rs(u,c,d),v=this.rs(u,c,_),R=this.ss(u,c,h),N=this._s(u.indexId,l,y,d.inclusive,v,_.inclusive,R);return m.forEach(N,(k=>n.Gn(k,t.limit).next((L=>{L.forEach((re=>{const G=A.fromSegments(re.documentKey);a.has(G)||(a=a.add(G),o.push(G))}))}))))})).next((()=>o))}return m.resolve(null)}))}ts(e){let t=this.es.get(e);return t||(e.filters.length===0?t=[e]:t=E_(B.create(e.filters,"and")).map((n=>Ci(e.path,e.collectionGroup,e.orderBy,n.getFilters(),e.limit,e.startAt,e.endAt))),this.es.set(e,t),t)}_s(e,t,n,s,i,a,o){const u=(t!=null?t.length:1)*Math.max(n.length,i.length),c=u/(t!=null?t.length:1),l=[];for(let h=0;h<u;++h){const d=t?this.us(t[h/c]):ss,_=this.cs(e,d,n[h%c],s),y=this.ls(e,d,i[h%c],a),v=o.map((R=>this.cs(e,d,R,!0)));l.push(...this.createRange(_,y,v))}return l}cs(e,t,n,s){const i=new Ut(e,A.empty(),t,n);return s?i:i.ki()}ls(e,t,n,s){const i=new Ut(e,A.empty(),t,n);return s?i.ki():i}ns(e,t){const n=new Tu(t),s=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,s).next((i=>{let a=null;for(const o of i)n.zi(o)&&(!a||o.fields.length>a.fields.length)&&(a=o);return a}))}getIndexType(e,t){let n=2;const s=this.ts(t);return m.forEach(s,(i=>this.ns(e,i).next((a=>{a?n!==0&&a.fields.length<(function(u){let c=new U(te.comparator),l=!1;for(const h of u.filters)for(const d of h.getFlattenedFilters())d.field.isKeyField()||(d.op==="array-contains"||d.op==="array-contains-any"?l=!0:c=c.add(d.field));for(const h of u.orderBy)h.field.isKeyField()||(c=c.add(h.field));return c.size+(l?1:0)})(i)&&(n=1):n=0})))).next((()=>(function(a){return a.limit!==null})(t)&&s.length>1&&n===2?1:n))}Es(e,t){const n=new tr;for(const s of Nt(e)){const i=t.data.field(s.fieldPath);if(i==null)return null;const a=n.Mi(s.kind);Ft.Pi.ei(i,a)}return n.Fi()}us(e){const t=new tr;return Ft.Pi.ei(e,t.Mi(0)),t.Fi()}hs(e,t){const n=new tr;return Ft.Pi.ei(Xt(this.databaseId,t),n.Mi((function(i){const a=Nt(i);return a.length===0?0:a[a.length-1].kind})(e))),n.Fi()}ss(e,t,n){if(n===null)return[];let s=[];s.push(new tr);let i=0;for(const a of Nt(e)){const o=n[i++];for(const u of s)if(this.Ts(t,a.fieldPath)&&Et(o))s=this.Ps(s,a,o);else{const c=u.Mi(a.kind);Ft.Pi.ei(o,c)}}return this.Is(s)}rs(e,t,n){return this.ss(e,t,n.position)}Is(e){const t=[];for(let n=0;n<e.length;++n)t[n]=e[n].Fi();return t}Ps(e,t,n){const s=[...e],i=[];for(const a of n.arrayValue.values||[])for(const o of s){const u=new tr;u.seed(o.Fi()),Ft.Pi.ei(a,u.Mi(t.kind)),i.push(u)}return i}Ts(e,t){return!!e.filters.find((n=>n instanceof O&&n.field.isEqual(t)&&(n.op==="in"||n.op==="not-in")))}getFieldIndexes(e,t){const n=nr(e),s=mn(e);return(t?n.Qn(Ui,IDBKeyRange.bound(t,t)):n.Qn()).next((i=>{const a=[];return m.forEach(i,(o=>s.get([o.indexId,this.uid]).next((u=>{a.push((function(l,h){const d=h?new Ar(h.sequenceNumber,new Se(tn(h.readTime),new A($e(h.documentKey)),h.largestBatchId)):Ar.empty(),_=l.fields.map((([y,v])=>new cs(te.fromServerFormat(y),v)));return new ws(l.indexId,l.collectionGroup,_,d)})(o,u))})))).next((()=>a))}))}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next((t=>t.length===0?null:(t.sort(((n,s)=>{const i=n.indexState.sequenceNumber-s.indexState.sequenceNumber;return i!==0?i:S(n.collectionGroup,s.collectionGroup)})),t[0].collectionGroup)))}updateCollectionGroup(e,t,n){const s=nr(e),i=mn(e);return this.Rs(e).next((a=>s.Qn(Ui,IDBKeyRange.bound(t,t)).next((o=>m.forEach(o,(u=>i.put(mu(u.indexId,this.uid,a,n))))))))}updateIndexEntries(e,t){const n=new Map;return m.forEach(t,((s,i)=>{const a=n.get(s.collectionGroup);return(a?m.resolve(a):this.getFieldIndexes(e,s.collectionGroup)).next((o=>(n.set(s.collectionGroup,o),m.forEach(o,(u=>this.As(e,s,u).next((c=>{const l=this.Vs(i,u);return c.isEqual(l)?m.resolve():this.ds(e,i,u,c,l)})))))))}))}fs(e,t,n,s){return fn(e).put(s.qi(this.uid,this.hs(n,t.key),t.key))}ps(e,t,n,s){return fn(e).delete(s.$i(this.uid,this.hs(n,t.key),t.key))}As(e,t,n){const s=fn(e);let i=new U(lt);return s.Hn({index:xl,range:IDBKeyRange.only([n.indexId,this.uid,_s(this.hs(n,t))])},((a,o)=>{i=i.add(new Ut(n.indexId,t,Iu(o.arrayValue),Iu(o.directionalValue)))})).next((()=>i))}Vs(e,t){let n=new U(lt);const s=this.Es(t,e);if(s==null)return n;const i=Si(t);if(i!=null){const a=e.data.field(i.fieldPath);if(Et(a))for(const o of a.arrayValue.values||[])n=n.add(new Ut(t.indexId,e.key,this.us(o),s))}else n=n.add(new Ut(t.indexId,e.key,ss,s));return n}ds(e,t,n,s,i){T(wu,"Updating index entries for document '%s'",t.key);const a=[];return(function(u,c,l,h,d){const _=u.getIterator(),y=c.getIterator();let v=cn(_),R=cn(y);for(;v||R;){let N=!1,k=!1;if(v&&R){const L=l(v,R);L<0?k=!0:L>0&&(N=!0)}else v!=null?k=!0:N=!0;N?(h(R),R=cn(y)):k?(d(v),v=cn(_)):(v=cn(_),R=cn(y))}})(s,i,lt,(o=>{a.push(this.fs(e,t,n,o))}),(o=>{a.push(this.ps(e,t,n,o))})),m.waitFor(a)}Rs(e){let t=1;return mn(e).Hn({index:bl,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},((n,s,i)=>{i.done(),t=s.sequenceNumber+1})).next((()=>t))}createRange(e,t,n){n=n.sort(((a,o)=>lt(a,o))).filter(((a,o,u)=>!o||lt(a,u[o-1])!==0));const s=[];s.push(e);for(const a of n){const o=lt(a,e),u=lt(a,t);if(o===0)s[0]=e.ki();else if(o>0&&u<0)s.push(a),s.push(a.ki());else if(u>0)break}s.push(t);const i=[];for(let a=0;a<s.length;a+=2){if(this.gs(s[a],s[a+1]))return[];const o=s[a].$i(this.uid,ss,A.empty()),u=s[a+1].$i(this.uid,ss,A.empty());i.push(IDBKeyRange.bound(o,u))}return i}gs(e,t){return lt(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(Vu)}getMinOffset(e,t){return m.mapArray(this.ts(t),(n=>this.ns(e,n).next((s=>s||V(44426))))).next(Vu)}}function Au(r){return ne(r,Nr)}function fn(r){return ne(r,pr)}function nr(r){return ne(r,$a)}function mn(r){return ne(r,_r)}function Vu(r){E(r.length!==0,28825);let e=r[0].indexState.offset,t=e.largestBatchId;for(let n=1;n<r.length;n++){const s=r[n].indexState.offset;la(s,e)<0&&(e=s),t<s.largestBatchId&&(t=s.largestBatchId)}return new Se(e.readTime,e.documentKey,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it{constructor(e){this.ys=e}next(){return this.ys+=2,this.ys}static ws(){return new it(0)}static bs(){return new it(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class V_{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.Ss(e).next((t=>{const n=new it(t.highestTargetId);return t.highestTargetId=n.next(),this.vs(e,t).next((()=>t.highestTargetId))}))}getLastRemoteSnapshotVersion(e){return this.Ss(e).next((t=>b.fromTimestamp(new F(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds))))}getHighestSequenceNumber(e){return this.Ss(e).next((t=>t.highestListenSequenceNumber))}setTargetsMetadata(e,t,n){return this.Ss(e).next((s=>(s.highestListenSequenceNumber=t,n&&(s.lastRemoteSnapshotVersion=n.toTimestamp()),t>s.highestListenSequenceNumber&&(s.highestListenSequenceNumber=t),this.vs(e,s))))}addTargetData(e,t){return this.Ds(e,t).next((()=>this.Ss(e).next((n=>(n.targetCount+=1,this.xs(t,n),this.vs(e,n))))))}updateTargetData(e,t){return this.Ds(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next((()=>_n(e).delete(t.targetId))).next((()=>this.Ss(e))).next((n=>(E(n.targetCount>0,8065),n.targetCount-=1,this.vs(e,n))))}removeTargets(e,t,n){let s=0;const i=[];return _n(e).Hn(((a,o)=>{const u=or(this.serializer,o);u.sequenceNumber<=t&&n.get(u.targetId)===null&&(s++,i.push(this.removeTargetData(e,u)))})).next((()=>m.waitFor(i))).next((()=>s))}forEachTarget(e,t){return _n(e).Hn(((n,s)=>{const i=or(this.serializer,s);t(i)}))}Ss(e){return vu(e).get(Cs).next((t=>(E(t!==null,2888),t)))}vs(e,t){return vu(e).put(Cs,t)}Ds(e,t){return _n(e).put(Ml(this.serializer,t))}xs(e,t){let n=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,n=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,n=!0),n}getTargetCount(e){return this.Ss(e).next((t=>t.targetCount))}getTargetData(e,t){const n=ei(t),s=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let i=null;return _n(e).Hn({range:s,index:Pl},((a,o,u)=>{const c=or(this.serializer,o);Fa(t,c.target)&&(i=c,u.done())})).next((()=>i))}addMatchingKeys(e,t,n){const s=[],i=ft(e);return t.forEach((a=>{const o=me(a.path);s.push(i.put({targetId:n,path:o})),s.push(this.referenceDelegate.addReference(e,n,a))})),m.waitFor(s)}removeMatchingKeys(e,t,n){const s=ft(e);return m.forEach(t,(i=>{const a=me(i.path);return m.waitFor([s.delete([n,a]),this.referenceDelegate.removeReference(e,n,i)])}))}removeMatchingKeysForTargetId(e,t){const n=ft(e),s=IDBKeyRange.bound([t],[t+1],!1,!0);return n.delete(s)}getMatchingKeysForTargetId(e,t){const n=IDBKeyRange.bound([t],[t+1],!1,!0),s=ft(e);let i=C();return s.Hn({range:n,jn:!0},((a,o,u)=>{const c=$e(a[1]),l=new A(c);i=i.add(l)})).next((()=>i))}containsKey(e,t){const n=me(t.path),s=IDBKeyRange.bound([n],[Yu(n)],!1,!0);let i=0;return ft(e).Hn({index:qa,jn:!0,range:s},(([a,o],u,c)=>{a!==0&&(i++,c.done())})).next((()=>i>0))}ye(e,t){return _n(e).get(t).next((n=>n?or(this.serializer,n):null))}}function _n(r){return ne(r,On)}function vu(r){return ne(r,Qt)}function ft(r){return ne(r,Mn)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class v_{constructor(e,t){this.db=e,this.garbageCollector=tl(this,t)}ir(e){const t=this.Cs(e);return this.db.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}Cs(e){let t=0;return this.sr(e,(n=>{t++})).next((()=>t))}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}sr(e,t){return this.Fs(e,((n,s)=>t(s)))}addReference(e,t,n){return is(e,n)}removeReference(e,t,n){return is(e,n)}removeTargets(e,t,n){return this.db.getTargetCache().removeTargets(e,t,n)}markPotentiallyOrphaned(e,t){return is(e,t)}Os(e,t){return(function(s,i){let a=!1;return Bl(s).Jn((o=>Ul(s,o,i).next((u=>(u&&(a=!0),m.resolve(!u)))))).next((()=>a))})(e,t)}removeOrphanedDocuments(e,t){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),s=[];let i=0;return this.Fs(e,((a,o)=>{if(o<=t){const u=this.Os(e,a).next((c=>{if(!c)return i++,n.getEntry(e,a).next((()=>(n.removeEntry(a,b.min()),ft(e).delete((function(h){return[0,me(h.path)]})(a)))))}));s.push(u)}})).next((()=>m.waitFor(s))).next((()=>n.apply(e))).next((()=>i))}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,n)}updateLimboDocument(e,t){return is(e,t)}Fs(e,t){const n=ft(e);let s,i=Te.wn;return n.Hn({index:qa},(([a,o],{path:u,sequenceNumber:c})=>{a===0?(i!==Te.wn&&t(new A($e(s)),i),i=c,s=u):i=Te.wn})).next((()=>{i!==Te.wn&&t(new A($e(s)),i)}))}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function is(r,e){return ft(r).put((function(n,s){return{targetId:0,path:me(n.path),sequenceNumber:s}})(e,r.currentSequenceNumber))}// Copyright 2024 Google LLC* @license
function zl(r,e){var n;let t=e;for(const s of r.stages)t=R_({serializer:r.serializer,serverTimestampBehavior:(n=r.listenOptions)==null?void 0:n.serverTimestampBehavior},s,t);return t}function ai(r,e){return zl(r,[e]).length>0}function Gl(r,e){return W(r)?ai(r,e):Ks(r,e)}function R_(r,e,t){if(e instanceof Kr)return(function(s,i,a){return a.filter((o=>o.isFoundDocument()&&`/${o.key.getCollectionPath().canonicalString()}`===i.hr))})(0,e,t);if(e instanceof jr)return(function(s,i,a){return a.filter((o=>{const u=mr(x(i.condition).evaluate(s,o));return u!==void 0&&Ne(u,Ae)}))})(r,e,t);if(e instanceof Qr)return(function(s,i,a){return a.filter((o=>o.isFoundDocument()&&o.key.getCollectionPath().lastSegment()===i.collectionId))})(0,e,t);if(e instanceof Ys)return(function(s,i,a){return a.filter((o=>o.isFoundDocument()))})(0,0,t);if(e instanceof Js)return(function(s,i,a){return a.filter((o=>o.isFoundDocument()&&i.Pr.has(o.key.path.toStringWithLeadingSlash())))})(0,e,t);if(e instanceof vt)return(function(s,i,a){return a.slice(0,i.limit)})(0,e,t);if(e instanceof qe)return(function(s,i,a){const o=i.orderings.map((u=>({Ms:x(u.expr),direction:u.direction})));return[...a].sort(((u,c)=>{for(const{Ms:l,direction:h}of o){const d=mr(l.evaluate(s,u)),_=mr(l.evaluate(s,c)),y=_e(d??Ge,_??Ge);if(y!==0)return h==="ascending"?y:-y}return 0}))})(r,e,t);throw new Error(`Unknown stage: ${e._name}`)}function Qi(r){const e=(function(n){for(let s=n.stages.length-1;s>=0;s--){const i=n.stages[s];if(i instanceof qe)return i.orderings}throw new Error("Pipeline must contain at least one Sort stage")})(r);return(t,n)=>{for(const s of e){const i=mr(x(s.expr).evaluate({serializer:r.serializer},t)),a=mr(x(s.expr).evaluate({serializer:r.serializer},n)),o=_e(i||Ge,a||Ge);if(o!==0)return s.direction==="ascending"?o:-o}return 0}}function yi(r){for(let e=r.stages.length-1;e>=0;e--){const t=r.stages[e];if(t instanceof vt)return{limit:t.limit}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kl{constructor(){this.changes=new ot((e=>e.toString()),((e,t)=>e.isEqual(t))),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,K.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return n!==void 0?m.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class P_{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,n){return ht(e).put(n)}removeEntry(e,t,n){return ht(e).delete((function(i,a){const o=i.path.toArray();return[o.slice(0,o.length-2),o[o.length-2],Ns(a),o[o.length-1]]})(t,n))}updateMetadata(e,t){return this.getMetadata(e).next((n=>(n.byteSize+=t,this.Ns(e,n))))}getEntry(e,t){let n=K.newInvalidDocument(t);return ht(e).Hn({index:ms,range:IDBKeyRange.only(rr(t))},((s,i)=>{n=this.Ls(t,i)})).next((()=>n))}Bs(e,t){let n={size:0,document:K.newInvalidDocument(t)};return ht(e).Hn({index:ms,range:IDBKeyRange.only(rr(t))},((s,i)=>{n={document:this.Ls(t,i),size:Ds(i)}})).next((()=>n))}getEntries(e,t){let n=ee();return this.Us(e,t,((s,i)=>{const a=this.Ls(s,i);n=n.insert(s,a)})).next((()=>n))}getAllEntries(e){let t=ee();return ht(e).Hn(((n,s)=>{const i=this.Ls(A.fromSegments(s.prefixPath.concat(s.collectionGroup,s.documentId)),s);t=t.insert(i.key,i)})).next((()=>t))}ks(e,t){let n=ee(),s=new q(A.comparator);return this.Us(e,t,((i,a)=>{const o=this.Ls(i,a);n=n.insert(i,o),s=s.insert(i,Ds(a))})).next((()=>({documents:n,qs:s})))}Us(e,t,n){if(t.isEmpty())return m.resolve();let s=new U(bu);t.forEach((u=>s=s.add(u)));const i=IDBKeyRange.bound(rr(s.first()),rr(s.last())),a=s.getIterator();let o=a.getNext();return ht(e).Hn({index:ms,range:i},((u,c,l)=>{const h=A.fromSegments([...c.prefixPath,c.collectionGroup,c.documentId]);for(;o&&bu(o,h)<0;)n(o,null),o=a.getNext();o&&o.isEqual(h)&&(n(o,c),o=a.hasNext()?a.getNext():null),o?l.Kn(rr(o)):l.done()})).next((()=>{for(;o;)n(o,null),o=a.hasNext()?a.getNext():null}))}getDocumentsMatchingQuery(e,t,n,s,i){const a=W(t)?D.fromString(Wr(t)):t.path,o=[a.popLast().toArray(),a.lastSegment(),Ns(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],u=[a.popLast().toArray(),a.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return ht(e).Qn(IDBKeyRange.bound(o,u,!0)).next((c=>{i==null||i.incrementDocumentReadCount(c.length);let l=ee();for(const h of c){const d=this.Ls(A.fromSegments(h.prefixPath.concat(h.collectionGroup,h.documentId)),h);d.isFoundDocument()&&(Gl(t,d)||s.has(d.key))&&(l=l.insert(d.key,d))}return l}))}getAllFromCollectionGroup(e,t,n,s){let i=ee();const a=Pu(t,n),o=Pu(t,Se.max());return ht(e).Hn({index:Rl,range:IDBKeyRange.bound(a,o,!0)},((u,c,l)=>{const h=this.Ls(A.fromSegments(c.prefixPath.concat(c.collectionGroup,c.documentId)),c);i=i.insert(h.key,h),i.size===s&&l.done()})).next((()=>i))}newChangeBuffer(e){return new b_(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next((t=>t.byteSize))}getMetadata(e){return Ru(e).get(Fi).next((t=>(E(!!t,20021),t)))}Ns(e,t){return Ru(e).put(Fi,t)}Ls(e,t){if(t){const n=f_(this.serializer,t);if(!(n.isNoDocument()&&n.version.isEqual(b.min())))return n}return K.newInvalidDocument(e)}}function Ql(r){return new P_(r)}class b_ extends Kl{constructor(e,t){super(),this.$s=e,this.trackRemovals=t,this.Ks=new ot((n=>n.toString()),((n,s)=>n.isEqual(s)))}applyChanges(e){const t=[];let n=0,s=new U(((i,a)=>S(i.canonicalString(),a.canonicalString())));return this.changes.forEach(((i,a)=>{const o=this.Ks.get(i);if(t.push(this.$s.removeEntry(e,i,o.readTime)),a.isValidDocument()){const u=du(this.$s.serializer,a);s=s.add(i.path.popLast());const c=Ds(u);n+=c-o.size,t.push(this.$s.addEntry(e,i,u))}else if(n-=o.size,this.trackRemovals){const u=du(this.$s.serializer,a.convertToNoDocument(b.min()));t.push(this.$s.addEntry(e,i,u))}})),s.forEach((i=>{t.push(this.$s.indexManager.addToCollectionParentIndex(e,i))})),t.push(this.$s.updateMetadata(e,n)),m.waitFor(t)}getFromCache(e,t){return this.$s.Bs(e,t).next((n=>(this.Ks.set(t,{size:n.size,readTime:n.document.readTime}),n.document)))}getAllFromCache(e,t){return this.$s.ks(e,t).next((({documents:n,qs:s})=>(s.forEach(((i,a)=>{this.Ks.set(i,{size:a,readTime:n.get(i).readTime})})),n)))}}function Ru(r){return ne(r,Dr)}function ht(r){return ne(r,Ss)}function rr(r){const e=r.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function Pu(r,e){const t=e.documentKey.path.toArray();return[r,Ns(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function bu(r,e){const t=r.path.toArray(),n=e.path.toArray();let s=0;for(let i=0;i<t.length-2&&i<n.length-2;++i)if(s=S(t[i],n[i]),s)return s;return s=S(t.length,n.length),s||(s=S(t[t.length-2],n[n.length-2]),s||S(t[t.length-1],n[n.length-1]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class x_{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jl{constructor(e,t,n,s){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=s}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next((s=>(n=s,this.remoteDocumentCache.getEntry(e,t)))).next((s=>(n!==null&&cr(n.mutation,s,Ie.empty(),F.now()),s)))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.getLocalViewOfDocuments(e,n,C()).next((()=>n))))}getLocalViewOfDocuments(e,t,n=C()){const s=De();return this.populateOverlays(e,s,t).next((()=>this.computeViews(e,t,s,n).next((i=>{let a=Lt();return i.forEach(((o,u)=>{a=a.insert(o,u.overlayedDocument)})),a}))))}getOverlayedDocuments(e,t){const n=De();return this.populateOverlays(e,n,t).next((()=>this.computeViews(e,t,n,C())))}populateOverlays(e,t,n){const s=[];return n.forEach((i=>{t.has(i)||s.push(i)})),this.documentOverlayCache.getOverlays(e,s).next((i=>{i.forEach(((a,o)=>{t.set(a,o)}))}))}computeViews(e,t,n,s){let i=ee();const a=hr(),o=(function(){return hr()})();return t.forEach(((u,c)=>{const l=n.get(c.key);s.has(c.key)&&(l===void 0||l.mutation instanceof at)?i=i.insert(c.key,c):l!==void 0?(a.set(c.key,l.mutation.getFieldMask()),cr(l.mutation,c,l.mutation.getFieldMask(),F.now())):a.set(c.key,Ie.empty())})),this.recalculateAndSaveOverlays(e,i).next((u=>(u.forEach(((c,l)=>a.set(c,l))),t.forEach(((c,l)=>o.set(c,new x_(l,a.get(c)??null)))),o)))}recalculateAndSaveOverlays(e,t){const n=hr();let s=new q(((a,o)=>a-o)),i=C();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next((a=>{for(const o of a)o.keys().forEach((u=>{const c=t.get(u);if(c===null)return;let l=n.get(u)||Ie.empty();l=o.applyToLocalView(c,l),n.set(u,l);const h=(s.get(o.batchId)||C()).add(u);s=s.insert(o.batchId,h)}))})).next((()=>{const a=[],o=s.getReverseIterator();for(;o.hasNext();){const u=o.getNext(),c=u.key,l=u.value,h=Sc();l.forEach((d=>{if(!i.has(d)){const _=mc(t.get(d),n.get(d));_!==null&&h.set(d,_),i=i.add(d)}})),a.push(this.documentOverlayCache.saveOverlays(e,c,h))}return m.waitFor(a)})).next((()=>n))}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next((n=>this.recalculateAndSaveOverlays(e,n)))}getDocumentsMatchingQuery(e,t,n,s){return W(t)?this.getDocumentsMatchingPipeline(e,t,n,s):fd(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):fa(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,s):this.getDocumentsMatchingCollectionQuery(e,t,n,s)}getNextDocuments(e,t,n,s){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,s).next((i=>{const a=s-i.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,s-i.size):m.resolve(De());let o=Nn,u=i;return a.next((c=>m.forEach(c,((l,h)=>(o<h.largestBatchId&&(o=h.largestBatchId),i.get(l)?m.resolve():this.remoteDocumentCache.getEntry(e,l).next((d=>{u=u.insert(l,d)}))))).next((()=>this.populateOverlays(e,c,i))).next((()=>this.computeViews(e,u,c,C()))).next((l=>({batchId:o,changes:xc(l)})))))}))}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new A(t)).next((n=>{let s=Lt();return n.isFoundDocument()&&(s=s.insert(n.key,n)),s}))}getDocumentsMatchingCollectionGroupQuery(e,t,n,s){const i=t.collectionGroup;let a=Lt();return this.indexManager.getCollectionParents(e,i).next((o=>m.forEach(o,(u=>{const c=(function(h,d){return new nn(d,null,h.explicitOrderBy.slice(),h.filters.slice(),h.limit,h.limitType,h.startAt,h.endAt)})(t,u.child(i));return this.getDocumentsMatchingCollectionQuery(e,c,n,s).next((l=>{l.forEach(((h,d)=>{a=a.insert(h,d)}))}))})).next((()=>a))))}getDocumentsMatchingCollectionQuery(e,t,n,s){let i;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next((a=>(i=a,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s)))).next((a=>this.retrieveMatchingLocalDocuments(i,a,(o=>Ks(t,o)))))}getDocumentsMatchingPipeline(e,t,n,s){if(Ze(t)==="collection_group"){const i=Ca(t);let a=Lt();return this.indexManager.getCollectionParents(e,i).next((o=>m.forEach(o,(u=>{const c=(function(h,d){const _=h.stages.map((y=>y instanceof Qr?new Kr(d.canonicalString(),{}):y));return new fe(h.serializer,_)})(t,u.child(i));return this.getDocumentsMatchingPipeline(e,c,n,s).next((l=>{l.forEach(((h,d)=>{a=a.insert(h,d)}))}))})).next((()=>a))))}{let i;return this.getOverlaysForPipeline(e,t,n.largestBatchId).next((a=>{switch(i=a,Ze(t)){case"collection":return this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,i,s);case"documents":let o=C();for(const u of Ps(t))o=o.add(A.fromPath(u));return this.remoteDocumentCache.getEntries(e,o);case"database":return this.remoteDocumentCache.getAllEntries(e);default:throw new I("invalid-argument",`Invalid pipeline source to execute offline: ${et(t)}`)}})).next((a=>this.retrieveMatchingLocalDocuments(i,a,(o=>ai(t,o)))))}}retrieveMatchingLocalDocuments(e,t,n){e.forEach(((i,a)=>{const o=a.getKey();t.get(o)===null&&(t=t.insert(o,K.newInvalidDocument(o)))}));let s=Lt();return t.forEach(((i,a)=>{const o=e.get(i);o!==void 0&&cr(o.mutation,a,Ie.empty(),F.now()),n(a)&&(s=s.insert(i,a))})),s}getOverlaysForPipeline(e,t,n){switch(Ze(t)){case"collection":return this.documentOverlayCache.getOverlaysForCollection(e,D.fromString(Wr(t)),n);case"collection_group":throw new I("invalid-argument",`Unexpected collection group pipeline: ${et(t)}`);case"documents":return this.documentOverlayCache.getOverlays(e,Ps(t).map((s=>A.fromPath(s))));case"database":return this.documentOverlayCache.getAllOverlays(e,n);default:throw new I("invalid-argument",`Failed to get overlays for pipeline: ${et(t)}`)}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class S_{constructor(e){this.serializer=e,this.Qs=new Map,this.Ws=new Map}getBundleMetadata(e,t){return m.resolve(this.Qs.get(t))}saveBundleMetadata(e,t){return this.Qs.set(t.id,(function(s){return{id:s.id,version:s.version,createTime:oe(s.createTime)}})(t)),m.resolve()}getNamedQuery(e,t){return m.resolve(this.Ws.get(t))}saveNamedQuery(e,t){return this.Ws.set(t.name,(function(s){return{name:s.name,query:Fl(s.bundledQuery),readTime:oe(s.readTime)}})(t)),m.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class C_{constructor(){this.overlays=new q(A.comparator),this.Gs=new Map}getOverlay(e,t){return m.resolve(this.overlays.get(t))}getOverlays(e,t){const n=De();return m.forEach(t,(s=>this.getOverlay(e,s).next((i=>{i!==null&&n.set(s,i)})))).next((()=>n))}getAllOverlays(e,t){const n=De();return this.overlays.forEach(((s,i)=>{i.largestBatchId>t&&n.set(s,i)})),m.resolve(n)}saveOverlays(e,t,n){return n.forEach(((s,i)=>{this.Zr(e,t,i)})),m.resolve()}removeOverlaysForBatchId(e,t,n){const s=this.Gs.get(n);return s!==void 0&&(s.forEach((i=>this.overlays=this.overlays.remove(i))),this.Gs.delete(n)),m.resolve()}getOverlaysForCollection(e,t,n){const s=De(),i=t.length+1,a=new A(t.child("")),o=this.overlays.getIteratorFrom(a);for(;o.hasNext();){const u=o.getNext().value,c=u.getKey();if(!t.isPrefixOf(c.path))break;c.path.length===i&&u.largestBatchId>n&&s.set(u.getKey(),u)}return m.resolve(s)}getOverlaysForCollectionGroup(e,t,n,s){let i=new q(((c,l)=>c-l));const a=this.overlays.getIterator();for(;a.hasNext();){const c=a.getNext().value;if(c.getKey().getCollectionGroup()===t&&c.largestBatchId>n){let l=i.get(c.largestBatchId);l===null&&(l=De(),i=i.insert(c.largestBatchId,l)),l.set(c.getKey(),c)}}const o=De(),u=i.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach(((c,l)=>o.set(c,l))),!(o.size()>=s)););return m.resolve(o)}Zr(e,t,n){const s=this.overlays.get(n.key);if(s!==null){const a=this.Gs.get(s.largestBatchId).delete(n.key);this.Gs.set(s.largestBatchId,a)}this.overlays=this.overlays.insert(n.key,new Ka(t,n));let i=this.Gs.get(t);i===void 0&&(i=C(),this.Gs.set(t,i)),this.Gs.set(t,i.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class D_{constructor(){this.sessionToken=Q.EMPTY_BYTE_STRING}getSessionToken(e){return m.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,m.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wa{constructor(){this.zs=new U(se.js),this.Hs=new U(se.Js)}isEmpty(){return this.zs.isEmpty()}addReference(e,t){const n=new se(e,t);this.zs=this.zs.add(n),this.Hs=this.Hs.add(n)}Ys(e,t){e.forEach((n=>this.addReference(n,t)))}removeReference(e,t){this.Zs(new se(e,t))}Xs(e,t){e.forEach((n=>this.removeReference(n,t)))}e_(e){const t=new A(new D([])),n=new se(t,e),s=new se(t,e+1),i=[];return this.Hs.forEachInRange([n,s],(a=>{this.Zs(a),i.push(a.key)})),i}t_(){this.zs.forEach((e=>this.Zs(e)))}Zs(e){this.zs=this.zs.delete(e),this.Hs=this.Hs.delete(e)}n_(e){const t=new A(new D([])),n=new se(t,e),s=new se(t,e+1);let i=C();return this.Hs.forEachInRange([n,s],(a=>{i=i.add(a.key)})),i}containsKey(e){const t=new se(e,0),n=this.zs.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}}class se{constructor(e,t){this.key=e,this.r_=t}static js(e,t){return A.comparator(e.key,t.key)||S(e.r_,t.r_)}static Js(e,t){return S(e.r_,t.r_)||A.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class N_{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.Gr=1,this.i_=new U(se.js)}checkEmpty(e){return m.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,s){const i=this.Gr;this.Gr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const a=new Ua(i,t,n,s);this.mutationQueue.push(a);for(const o of s)this.i_=this.i_.add(new se(o.key,i)),this.indexManager.addToCollectionParentIndex(e,o.key.path.popLast());return m.resolve(a)}lookupMutationBatch(e,t){return m.resolve(this.s_(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,s=this.__(n),i=s<0?0:s;return m.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return m.resolve(this.mutationQueue.length===0?zt:this.Gr-1)}getAllMutationBatches(e){return m.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new se(t,0),s=new se(t,Number.POSITIVE_INFINITY),i=[];return this.i_.forEachInRange([n,s],(a=>{const o=this.s_(a.r_);i.push(o)})),m.resolve(i)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new U(S);return t.forEach((s=>{const i=new se(s,0),a=new se(s,Number.POSITIVE_INFINITY);this.i_.forEachInRange([i,a],(o=>{n=n.add(o.r_)}))})),m.resolve(this.o_(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,s=n.length+1;let i=n;A.isDocumentKey(i)||(i=i.child(""));const a=new se(new A(i),0);let o=new U(S);return this.i_.forEachWhile((u=>{const c=u.key.path;return!!n.isPrefixOf(c)&&(c.length===s&&(o=o.add(u.r_)),!0)}),a),m.resolve(this.o_(o))}o_(e){const t=[];return e.forEach((n=>{const s=this.s_(n);s!==null&&t.push(s)})),t}removeMutationBatch(e,t){E(this.a_(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.i_;return m.forEach(t.mutations,(s=>{const i=new se(s.key,t.batchId);return n=n.delete(i),this.referenceDelegate.markPotentiallyOrphaned(e,s.key)})).next((()=>{this.i_=n}))}Hr(e){}containsKey(e,t){const n=new se(t,0),s=this.i_.firstAfterOrEqual(n);return m.resolve(t.isEqual(s&&s.key))}performConsistencyCheck(e){return this.mutationQueue.length,m.resolve()}a_(e,t){return this.__(e)}__(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}s_(e){const t=this.__(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class k_{constructor(e){this.u_=e,this.docs=(function(){return new q(A.comparator)})(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,s=this.docs.get(n),i=s?s.size:0,a=this.u_(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:a}),this.size+=a-i,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return m.resolve(n?n.document.mutableCopy():K.newInvalidDocument(t))}getEntries(e,t){let n=ee();return t.forEach((s=>{const i=this.docs.get(s);n=n.insert(s,i?i.document.mutableCopy():K.newInvalidDocument(s))})),m.resolve(n)}getAllEntries(e){let t=ee();return this.docs.forEach(((n,s)=>{t=t.insert(n,s.document)})),m.resolve(t)}getDocumentsMatchingQuery(e,t,n,s){let i,a;W(t)?(i=D.fromString(Wr(t)),a=l=>ai(t,l)):(i=t.path,a=l=>Ks(t,l));let o=ee();const u=new A(i.child("__id-9223372036854775808__")),c=this.docs.getIteratorFrom(u);for(;c.hasNext();){const{key:l,value:{document:h}}=c.getNext();if(!i.isPrefixOf(l.path))break;l.path.length>i.length+1||la(Vc(h),n)<=0||(s.has(h.key)||a(h))&&(o=o.insert(h.key,h.mutableCopy()))}return m.resolve(o)}getAllFromCollectionGroup(e,t,n,s){V(9500)}c_(e,t){return m.forEach(this.docs,(n=>t(n)))}newChangeBuffer(e){return new L_(this)}getSize(e){return m.resolve(this.size)}}class L_ extends Kl{constructor(e){super(),this.$s=e}applyChanges(e){const t=[];return this.changes.forEach(((n,s)=>{s.isValidDocument()?t.push(this.$s.addEntry(e,s)):this.$s.removeEntry(n)})),m.waitFor(t)}getFromCache(e,t){return this.$s.getEntry(e,t)}getAllFromCache(e,t){return this.$s.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class O_{constructor(e){this.persistence=e,this.l_=new ot((t=>ei(t)),Fa),this.lastRemoteSnapshotVersion=b.min(),this.highestTargetId=0,this.E_=0,this.h_=new Wa,this.targetCount=0,this.T_=it.ws()}forEachTarget(e,t){return this.l_.forEach(((n,s)=>t(s))),m.resolve()}getLastRemoteSnapshotVersion(e){return m.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return m.resolve(this.E_)}allocateTargetId(e){return this.highestTargetId=this.T_.next(),m.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.E_&&(this.E_=t),m.resolve()}Ds(e){this.l_.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.T_=new it(t),this.highestTargetId=t),e.sequenceNumber>this.E_&&(this.E_=e.sequenceNumber)}addTargetData(e,t){return this.Ds(t),this.targetCount+=1,m.resolve()}updateTargetData(e,t){return this.Ds(t),m.resolve()}removeTargetData(e,t){return this.l_.delete(t.target),this.h_.e_(t.targetId),this.targetCount-=1,m.resolve()}removeTargets(e,t,n){let s=0;const i=[];return this.l_.forEach(((a,o)=>{o.sequenceNumber<=t&&n.get(o.targetId)===null&&(this.l_.delete(a),i.push(this.removeMatchingKeysForTargetId(e,o.targetId)),s++)})),m.waitFor(i).next((()=>s))}getTargetCount(e){return m.resolve(this.targetCount)}getTargetData(e,t){const n=this.l_.get(t)||null;return m.resolve(n)}addMatchingKeys(e,t,n){return this.h_.Ys(t,n),m.resolve()}removeMatchingKeys(e,t,n){this.h_.Xs(t,n);const s=this.persistence.referenceDelegate,i=[];return s&&t.forEach((a=>{i.push(s.markPotentiallyOrphaned(e,a))})),m.waitFor(i)}removeMatchingKeysForTargetId(e,t){return this.h_.e_(t),m.resolve()}getMatchingKeysForTargetId(e,t){const n=this.h_.n_(t);return m.resolve(n)}containsKey(e,t){return m.resolve(this.h_.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ha{constructor(e,t){this.P_={},this.overlays={},this.I_=new Te(0),this.R_=!1,this.R_=!0,this.A_=new D_,this.referenceDelegate=e(this),this.V_=new O_(this),this.indexManager=new w_,this.remoteDocumentCache=(function(s){return new k_(s)})((n=>this.referenceDelegate.d_(n))),this.serializer=new Ol(t),this.f_=new S_(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.R_=!1,Promise.resolve()}get started(){return this.R_}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new C_,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.P_[e.toKey()];return n||(n=new N_(t,this.referenceDelegate),this.P_[e.toKey()]=n),n}getGlobalsCache(){return this.A_}getTargetCache(){return this.V_}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.f_}runTransaction(e,t,n){T("MemoryPersistence","Starting transaction:",e);const s=new M_(this.I_.next());return this.referenceDelegate.m_(),n(s).next((i=>this.referenceDelegate.p_(s).next((()=>i)))).toPromise().then((i=>(s.raiseOnCommittedEvent(),i)))}g_(e,t){return m.or(Object.values(this.P_).map((n=>()=>n.containsKey(e,t))))}}class M_ extends Jc{constructor(e){super(),this.currentSequenceNumber=e}}class oi{constructor(e){this.persistence=e,this.y_=new Wa,this.w_=null}static b_(e){return new oi(e)}get S_(){if(this.w_)return this.w_;throw V(60996)}addReference(e,t,n){return this.y_.addReference(n,t),this.S_.delete(n.toString()),m.resolve()}removeReference(e,t,n){return this.y_.removeReference(n,t),this.S_.add(n.toString()),m.resolve()}markPotentiallyOrphaned(e,t){return this.S_.add(t.toString()),m.resolve()}removeTarget(e,t){this.y_.e_(t.targetId).forEach((s=>this.S_.add(s.toString())));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next((s=>{s.forEach((i=>this.S_.add(i.toString())))})).next((()=>n.removeTargetData(e,t)))}m_(){this.w_=new Set}p_(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return m.forEach(this.S_,(n=>{const s=A.fromPath(n);return this.v_(e,s).next((i=>{i||t.removeEntry(s,b.min())}))})).next((()=>(this.w_=null,t.apply(e))))}updateLimboDocument(e,t){return this.v_(e,t).next((n=>{n?this.S_.delete(t.toString()):this.S_.add(t.toString())}))}d_(e){return 0}v_(e,t){return m.or([()=>m.resolve(this.y_.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.g_(e,t)])}}class Ls{constructor(e,t){this.persistence=e,this.D_=new ot((n=>me(n.path)),((n,s)=>n.isEqual(s))),this.garbageCollector=tl(this,t)}static b_(e,t){return new Ls(e,t)}m_(){}p_(e){return m.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}ir(e){const t=this.Cs(e);return this.persistence.getTargetCache().getTargetCount(e).next((n=>t.next((s=>n+s))))}Cs(e){let t=0;return this.sr(e,(n=>{t++})).next((()=>t))}sr(e,t){return m.forEach(this.D_,((n,s)=>this.Os(e,n,s).next((i=>i?m.resolve():t(s)))))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const s=this.persistence.getRemoteDocumentCache(),i=s.newChangeBuffer();return s.c_(e,(a=>this.Os(e,a,t).next((o=>{o||(n++,i.removeEntry(a,b.min()))})))).next((()=>i.apply(e))).next((()=>n))}markPotentiallyOrphaned(e,t){return this.D_.set(t,e.currentSequenceNumber),m.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.D_.set(n,e.currentSequenceNumber),m.resolve()}removeReference(e,t,n){return this.D_.set(n,e.currentSequenceNumber),m.resolve()}updateLimboDocument(e,t){return this.D_.set(t,e.currentSequenceNumber),m.resolve()}d_(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=os(e.data.value)),t}Os(e,t,n){return m.or([()=>this.persistence.g_(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const s=this.D_.get(t);return m.resolve(s!==void 0&&s>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class F_{constructor(e){this.serializer=e}Nn(e,t,n,s){const i=new Ws("createOrUpgrade",t);n<1&&s>=1&&((function(u){u.createObjectStore(Yr)})(e),(function(u){u.createObjectStore(Cr,{keyPath:$m}),u.createObjectStore(ke,{keyPath:lu,autoIncrement:!0}).createIndex(qt,hu,{unique:!0}),u.createObjectStore(Ln)})(e),xu(e),(function(u){u.createObjectStore(kt)})(e));let a=m.resolve();return n<3&&s>=3&&(n!==0&&((function(u){u.deleteObjectStore(Mn),u.deleteObjectStore(On),u.deleteObjectStore(Qt)})(e),xu(e)),a=a.next((()=>(function(u){const c=u.store(Qt),l={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:b.min().toTimestamp(),targetCount:0};return c.put(Cs,l)})(i)))),n<4&&s>=4&&(n!==0&&(a=a.next((()=>(function(u,c){return c.store(ke).Qn().next((h=>{u.deleteObjectStore(ke),u.createObjectStore(ke,{keyPath:lu,autoIncrement:!0}).createIndex(qt,hu,{unique:!0});const d=c.store(ke),_=h.map((y=>d.put(y)));return m.waitFor(_)}))})(e,i)))),a=a.next((()=>{(function(u){u.createObjectStore(Fn,{keyPath:Jm})})(e)}))),n<5&&s>=5&&(a=a.next((()=>this.x_(i)))),n<6&&s>=6&&(a=a.next((()=>((function(u){u.createObjectStore(Dr)})(e),this.C_(i))))),n<7&&s>=7&&(a=a.next((()=>this.F_(i)))),n<8&&s>=8&&(a=a.next((()=>this.O_(e,i)))),n<9&&s>=9&&(a=a.next((()=>{(function(u){u.objectStoreNames.contains("remoteDocumentChanges")&&u.deleteObjectStore("remoteDocumentChanges")})(e)}))),n<10&&s>=10&&(a=a.next((()=>this.M_(i)))),n<11&&s>=11&&(a=a.next((()=>{(function(u){u.createObjectStore(ti,{keyPath:Xm})})(e),(function(u){u.createObjectStore(ni,{keyPath:Zm})})(e)}))),n<12&&s>=12&&(a=a.next((()=>{(function(u){const c=u.createObjectStore(ri,{keyPath:a_});c.createIndex(Bi,o_,{unique:!1}),c.createIndex(Sl,u_,{unique:!1})})(e)}))),n<13&&s>=13&&(a=a.next((()=>(function(u){const c=u.createObjectStore(Ss,{keyPath:Gm});c.createIndex(ms,Km),c.createIndex(Rl,Qm)})(e))).next((()=>this.N_(e,i))).next((()=>e.deleteObjectStore(kt)))),n<14&&s>=14&&(a=a.next((()=>this.L_(e,i)))),n<15&&s>=15&&(a=a.next((()=>(function(u){u.createObjectStore($a,{keyPath:e_,autoIncrement:!0}).createIndex(Ui,t_,{unique:!1}),u.createObjectStore(_r,{keyPath:n_}).createIndex(bl,r_,{unique:!1}),u.createObjectStore(pr,{keyPath:s_}).createIndex(xl,i_,{unique:!1})})(e)))),n<16&&s>=16&&(a=a.next((()=>{t.objectStore(_r).clear()})).next((()=>{t.objectStore(pr).clear()}))),n<17&&s>=17&&(a=a.next((()=>{(function(u){u.createObjectStore(za,{keyPath:c_})})(e)}))),n<18&&s>=18&&Wu()&&(a=a.next((()=>{t.objectStore(_r).clear()})).next((()=>{t.objectStore(pr).clear()}))),a}C_(e){let t=0;return e.store(kt).Hn(((n,s)=>{t+=Ds(s)})).next((()=>{const n={byteSize:t};return e.store(Dr).put(Fi,n)}))}x_(e){const t=e.store(Cr),n=e.store(ke);return t.Qn().next((s=>m.forEach(s,(i=>{const a=IDBKeyRange.bound([i.userId,zt],[i.userId,i.lastAcknowledgedBatchId]);return n.Qn(qt,a).next((o=>m.forEach(o,(u=>{E(u.userId===i.userId,18650,"Cannot process batch from unexpected user",{batchId:u.batchId});const c=Mt(this.serializer,u);return Ll(e,i.userId,c).next((()=>{}))}))))}))))}F_(e){const t=e.store(Mn),n=e.store(kt);return e.store(Qt).get(Cs).next((s=>{const i=[];return n.Hn(((a,o)=>{const u=new D(a),c=(function(h){return[0,me(h)]})(u);i.push(t.get(c).next((l=>l?m.resolve():(h=>t.put({targetId:0,path:me(h),sequenceNumber:s.highestListenSequenceNumber}))(u))))})).next((()=>m.waitFor(i)))}))}O_(e,t){e.createObjectStore(Nr,{keyPath:Ym});const n=t.store(Nr),s=new ja,i=a=>{if(s.add(a)){const o=a.lastSegment(),u=a.popLast();return n.put({collectionId:o,parent:me(u)})}};return t.store(kt).Hn({jn:!0},((a,o)=>{const u=new D(a);return i(u.popLast())})).next((()=>t.store(Ln).Hn({jn:!0},(([a,o,u],c)=>{const l=$e(o);return i(l.popLast())}))))}M_(e){const t=e.store(On);return t.Hn(((n,s)=>{const i=or(this.serializer,s),a=Ml(this.serializer,i);return t.put(a)}))}N_(e,t){const n=t.store(kt),s=[];return n.Hn(((i,a)=>{const o=t.store(Ss),u=(function(h){return h.document?new A(D.fromString(h.document.name).popFirst(5)):h.noDocument?A.fromSegments(h.noDocument.path):h.unknownDocument?A.fromSegments(h.unknownDocument.path):V(36783)})(a).path.toArray(),c={prefixPath:u.slice(0,u.length-2),collectionGroup:u[u.length-2],documentId:u[u.length-1],readTime:a.readTime||[0,0],unknownDocument:a.unknownDocument,noDocument:a.noDocument,document:a.document,hasCommittedMutations:!!a.hasCommittedMutations};s.push(o.put(c))})).next((()=>m.waitFor(s)))}L_(e,t){const n=t.store(ke),s=Ql(this.serializer),i=new Ha(oi.b_,this.serializer.$r);return n.Qn().next((a=>{const o=new Map;return a.forEach((u=>{let c=o.get(u.userId)??C();Mt(this.serializer,u).keys().forEach((l=>c=c.add(l))),o.set(u.userId,c)})),m.forEach(o,((u,c)=>{const l=new he(c),h=ii.Qr(this.serializer,l),d=i.getIndexManager(l),_=si.Qr(l,this.serializer,d,i.referenceDelegate);return new jl(s,_,h,d).recalculateAndSaveOverlaysForDocumentKeys(new qi(t,Te.wn),u).next()}))}))}}function xu(r){r.createObjectStore(Mn,{keyPath:Wm}).createIndex(qa,Hm,{unique:!0}),r.createObjectStore(On,{keyPath:"targetId"}).createIndex(Pl,jm,{unique:!0}),r.createObjectStore(Qt)}const dt="IndexedDbPersistence",Ii=18e5,Ti=5e3,Ei="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",U_="main";class Ya{constructor(e,t,n,s,i,a,o,u,c,l,h=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=n,this.Ct=i,this.window=a,this.document=o,this.B_=c,this.U_=l,this.k_=h,this.I_=null,this.R_=!1,this.isPrimary=!1,this.networkEnabled=!0,this.q_=null,this.inForeground=!1,this.K_=null,this.Q_=null,this.W_=Number.NEGATIVE_INFINITY,this.G_=d=>Promise.resolve(),!Ya.Ye())throw new I(p.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new v_(this,s),this.z_=t+U_,this.serializer=new Ol(u),this.j_=new pt(this.z_,this.k_,new F_(this.serializer)),this.A_=new p_,this.V_=new V_(this.referenceDelegate,this.serializer),this.remoteDocumentCache=Ql(this.serializer),this.f_=new __,this.window&&this.window.localStorage?this.H_=this.window.localStorage:(this.H_=null,l===!1&&H(dt,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.J_().then((()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new I(p.FAILED_PRECONDITION,Ei);return this.Y_(),this.Z_(),this.X_(),this.runTransaction("getHighestListenSequenceNumber","readonly",(e=>this.V_.getHighestSequenceNumber(e)))})).then((e=>{this.I_=new Te(e,this.B_)})).then((()=>{this.R_=!0})).catch((e=>(this.j_&&this.j_.close(),Promise.reject(e))))}eo(e){return this.G_=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.j_.Bn((async t=>{t.newVersion===null&&await e()}))}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.Ct.enqueueAndForget((async()=>{this.started&&await this.J_()})))}J_(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",(e=>as(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next((()=>{if(this.isPrimary)return this.no(e).next((t=>{t||(this.isPrimary=!1,this.Ct.enqueueRetryable((()=>this.G_(!1))))}))})).next((()=>this.ro(e))).next((t=>this.isPrimary&&!t?this.io(e).next((()=>!1)):!!t&&this.so(e).next((()=>!0)))))).catch((e=>{if(Ct(e))return T(dt,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return T(dt,"Releasing owner lease after error during lease refresh",e),!1})).then((e=>{this.isPrimary!==e&&this.Ct.enqueueRetryable((()=>this.G_(e))),this.isPrimary=e}))}no(e){return sr(e).get(ln).next((t=>m.resolve(this._o(t))))}oo(e){return as(e).delete(this.clientId)}async ao(){if(this.isPrimary&&!this.uo(this.W_,Ii)){this.W_=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",(t=>{const n=ne(t,Fn);return n.Qn().next((s=>{const i=this.co(s,Ii),a=s.filter((o=>i.indexOf(o)===-1));return m.forEach(a,(o=>n.delete(o.clientId))).next((()=>a))}))})).catch((()=>[]));if(this.H_)for(const t of e)this.H_.removeItem(this.lo(t.clientId))}}X_(){this.Q_=this.Ct.enqueueAfterDelay("client_metadata_refresh",4e3,(()=>this.J_().then((()=>this.ao())).then((()=>this.X_()))))}_o(e){return!!e&&e.ownerId===this.clientId}ro(e){return this.U_?m.resolve(!0):sr(e).get(ln).next((t=>{if(t!==null&&this.uo(t.leaseTimestampMs,Ti)&&!this.Eo(t.ownerId)){if(this._o(t)&&this.networkEnabled)return!0;if(!this._o(t)){if(!t.allowTabSynchronization)throw new I(p.FAILED_PRECONDITION,Ei);return!1}}return!(!this.networkEnabled||!this.inForeground)||as(e).Qn().next((n=>this.co(n,Ti).find((s=>{if(this.clientId!==s.clientId){const i=!this.networkEnabled&&s.networkEnabled,a=!this.inForeground&&s.inForeground,o=this.networkEnabled===s.networkEnabled;if(i||a&&o)return!0}return!1}))===void 0))})).next((t=>(this.isPrimary!==t&&T(dt,`Client ${t?"is":"is not"} eligible for a primary lease.`),t)))}async shutdown(){this.R_=!1,this.ho(),this.Q_&&(this.Q_.cancel(),this.Q_=null),this.To(),this.Po(),await this.j_.runTransaction("shutdown","readwrite",[Yr,Fn],(e=>{const t=new qi(e,Te.wn);return this.io(t).next((()=>this.oo(t)))})),this.j_.close(),this.Io()}co(e,t){return e.filter((n=>this.uo(n.updateTimeMs,t)&&!this.Eo(n.clientId)))}Ro(){return this.runTransaction("getActiveClients","readonly",(e=>as(e).Qn().next((t=>this.co(t,Ii).map((n=>n.clientId))))))}get started(){return this.R_}getGlobalsCache(){return this.A_}getMutationQueue(e,t){return si.Qr(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.V_}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new A_(e,this.serializer.$r.databaseId)}getDocumentOverlayCache(e){return ii.Qr(this.serializer,e)}getBundleCache(){return this.f_}runTransaction(e,t,n){T(dt,"Starting transaction:",e);const s=t==="readonly"?"readonly":"readwrite",i=(function(u){return u===18?d_:u===17?kl:u===16?h_:u===15?Ga:u===14?Nl:u===13?Dl:u===12?l_:u===11?Cl:void V(60245)})(this.k_);let a;return this.j_.runTransaction(e,s,i,(o=>(a=new qi(o,this.I_?this.I_.next():Te.wn),t==="readwrite-primary"?this.no(a).next((u=>!!u||this.ro(a))).next((u=>{if(!u)throw H(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.Ct.enqueueRetryable((()=>this.G_(!1))),new I(p.FAILED_PRECONDITION,Yc);return n(a)})).next((u=>this.so(a).next((()=>u)))):this.Ao(a).next((()=>n(a)))))).then((o=>(a.raiseOnCommittedEvent(),o)))}Ao(e){return sr(e).get(ln).next((t=>{if(t!==null&&this.uo(t.leaseTimestampMs,Ti)&&!this.Eo(t.ownerId)&&!this._o(t)&&!(this.U_||this.allowTabSynchronization&&t.allowTabSynchronization))throw new I(p.FAILED_PRECONDITION,Ei)}))}so(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return sr(e).put(ln,t)}static Ye(){return pt.Ye()}io(e){const t=sr(e);return t.get(ln).next((n=>this._o(n)?(T(dt,"Releasing primary lease."),t.delete(ln)):m.resolve()))}uo(e,t){const n=Date.now();return!(e<n-t)&&(!(e>n)||(H(`Detected an update time that is in the future: ${e} > ${n}`),!1))}Y_(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.K_=()=>{this.Ct.enqueueAndForget((()=>(this.inForeground=this.document.visibilityState==="visible",this.J_())))},this.document.addEventListener("visibilitychange",this.K_),this.inForeground=this.document.visibilityState==="visible")}To(){this.K_&&(this.document.removeEventListener("visibilitychange",this.K_),this.K_=null)}Z_(){var e;typeof((e=this.window)==null?void 0:e.addEventListener)=="function"&&(this.q_=()=>{this.ho();const t=/(?:Version|Mobile)\/1[456]/;ju()&&(navigator.appVersion.match(t)||navigator.userAgent.match(t))&&this.Ct.enterRestrictedMode(!0),this.Ct.enqueueAndForget((()=>this.shutdown()))},this.window.addEventListener("pagehide",this.q_))}Po(){this.q_&&(this.window.removeEventListener("pagehide",this.q_),this.q_=null)}Eo(e){var t;try{const n=((t=this.H_)==null?void 0:t.getItem(this.lo(e)))!==null;return T(dt,`Client '${e}' ${n?"is":"is not"} zombied in LocalStorage`),n}catch(n){return H(dt,"Failed to get zombied client id.",n),!1}}ho(){if(this.H_)try{this.H_.setItem(this.lo(this.clientId),String(Date.now()))}catch(e){H("Failed to set zombie client id.",e)}}Io(){if(this.H_)try{this.H_.removeItem(this.lo(this.clientId))}catch{}}lo(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function sr(r){return ne(r,Yr)}function as(r){return ne(r,Fn)}function Wl(r,e){let t=r.projectId;return r.isDefaultDatabase||(t+="."+r.database),"firestore/"+e+"/"+t+"/"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ja{constructor(e,t,n,s){this.targetId=e,this.fromCache=t,this.Vo=n,this.fo=s}static mo(e,t){let n=C(),s=C();for(const i of t.docChanges)switch(i.type){case 0:n=n.add(i.doc.key);break;case 1:s=s.add(i.doc.key)}return new Ja(e,t.fromCache,n,s)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function B_(r,e){return A.comparator(r.key,e.key)}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class q_{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hl{constructor(){this.po=!1,this.yo=!1,this.wo=100,this.bo=(function(){return ju()?8:Xc(ys())>0?6:4})()}initialize(e,t){this.So=e,this.indexManager=t,this.po=!0}getDocumentsMatchingQuery(e,t,n,s){const i={result:null};return this.vo(e,t).next((a=>{i.result=a})).next((()=>{if(!i.result)return this.Do(e,t,s,n).next((a=>{i.result=a}))})).next((()=>{if(i.result)return;const a=new q_;return this.xo(e,t,a).next((o=>{if(i.result=o,this.yo)return this.Co(e,t,a,o.size)}))})).next((()=>i.result))}Co(e,t,n,s){return W(t)?m.resolve():n.documentReadCount<this.wo?(pn()<=Ye.DEBUG&&T("QueryEngine","SDK will not create cache indexes for query:",lr(t),"since it only creates cache indexes for collection contains","more than or equal to",this.wo,"documents"),m.resolve()):(pn()<=Ye.DEBUG&&T("QueryEngine","Query:",lr(t),"scans",n.documentReadCount,"local documents and returns",s,"documents as results."),n.documentReadCount>this.bo*s?(pn()<=Ye.DEBUG&&T("QueryEngine","The SDK decides to create cache indexes for query:",lr(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,xe(t))):m.resolve())}vo(e,t){if(W(t))return m.resolve(null);let n=t;if(Go(n))return m.resolve(null);let s=xe(n);return this.indexManager.getIndexType(e,s).next((i=>i===0?null:(n.limit!==null&&i===1&&(n=vs(n,null,"F"),s=xe(n)),this.indexManager.getDocumentsMatchingTarget(e,s).next((a=>{const o=C(...a);return this.So.getDocuments(e,o).next((u=>this.indexManager.getMinOffset(e,s).next((c=>{const l=this.Fo(n,u);return this.Oo(n,l,o,c.readTime)?this.vo(e,vs(n,null,"F")):this.Mo(e,l,n,c)}))))})))))}Do(e,t,n,s){return(W(t)?(function(a){for(const o of a.stages){if(o instanceof vt||o instanceof ou)return!1;if(o instanceof jr){if(o.condition instanceof dl&&o.condition._expr.name==="exists"&&o.condition._expr.params[0]instanceof sn&&o.condition._expr.params[0].fieldName===Ue)continue;return!1}}return!0})(t):Go(t))||s.isEqual(b.min())?m.resolve(null):this.So.getDocuments(e,n).next((i=>{const a=this.Fo(t,i);return this.Oo(t,a,n,s)?m.resolve(null):(pn()<=Ye.DEBUG&&T("QueryEngine","Re-using previous result from %s to execute query: %s",s.toString(),uu(t)),this.Mo(e,a,t,Ac(s,Nn)).next((o=>o)))}))}Fo(e,t){let n,s;return W(e)?(n=new U(B_),s=i=>ai(e,i)):(n=new U(ma(e)),s=i=>Ks(e,i)),t.forEach(((i,a)=>{s(a)&&(n=n.add(a))})),n}Oo(e,t,n,s){if(W(e))return(function(o){return o.stages.some((u=>u instanceof vt||u instanceof ou))})(e);if(e.limit===null)return!1;if(n.size!==t.size)return!0;const i=e.limitType==="F"?t.last():t.first();return!!i&&(i.hasPendingWrites||i.version.compareTo(s)>0)}xo(e,t,n){return pn()<=Ye.DEBUG&&T("QueryEngine","Using full collection scan to execute query:",uu(t)),this.So.getDocumentsMatchingQuery(e,t,Se.min(),n)}Mo(e,t,n,s){return this.So.getDocumentsMatchingQuery(e,n,s).next((i=>(t.forEach((a=>{i=i.insert(a.key,a)})),i)))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xa="LocalStore",$_=3e8;class z_{constructor(e,t,n,s){this.persistence=e,this.No=t,this.serializer=s,this.Lo=new q(S),this.Bo=new ot((i=>ei(i)),Fa),this.Uo=new Map,this.ko=e.getRemoteDocumentCache(),this.V_=e.getTargetCache(),this.f_=e.getBundleCache(),this.qo(n)}qo(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new jl(this.ko,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.ko.setIndexManager(this.indexManager),this.No.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",(t=>e.collect(t,this.Lo)))}}function Yl(r,e,t,n){return new z_(r,e,t,n)}async function Jl(r,e){const t=P(r);return await t.persistence.runTransaction("Handle user change","readonly",(n=>{let s;return t.mutationQueue.getAllMutationBatches(n).next((i=>(s=i,t.qo(e),t.mutationQueue.getAllMutationBatches(n)))).next((i=>{const a=[],o=[];let u=C();for(const c of s){a.push(c.batchId);for(const l of c.mutations)u=u.add(l.key)}for(const c of i){o.push(c.batchId);for(const l of c.mutations)u=u.add(l.key)}return t.localDocuments.getDocuments(n,u).next((c=>({$o:c,removedBatchIds:a,addedBatchIds:o})))}))}))}function G_(r,e){const t=P(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",(n=>{const s=e.batch.keys(),i=t.ko.newChangeBuffer({trackRemovals:!0});return(function(o,u,c,l){const h=c.batch,d=h.keys();let _=m.resolve();return d.forEach((y=>{_=_.next((()=>l.getEntry(u,y))).next((v=>{const R=c.docVersions.get(y);E(R!==null,48541),v.version.compareTo(R)<0&&(h.applyToRemoteDocument(v,c),v.isValidDocument()&&(v.setReadTime(c.commitVersion),l.addEntry(v)))}))})),_.next((()=>o.mutationQueue.removeMutationBatch(u,h)))})(t,n,e,i).next((()=>i.apply(n))).next((()=>t.mutationQueue.performConsistencyCheck(n))).next((()=>t.documentOverlayCache.removeOverlaysForBatchId(n,s,e.batch.batchId))).next((()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,(function(o){let u=C();for(let c=0;c<o.mutationResults.length;++c)o.mutationResults[c].transformResults.length>0&&(u=u.add(o.batch.mutations[c].key));return u})(e)))).next((()=>t.localDocuments.getDocuments(n,s)))}))}function Xl(r){const e=P(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",(t=>e.V_.getLastRemoteSnapshotVersion(t)))}function K_(r,e){const t=P(r),n=e.snapshotVersion;let s=t.Lo;return t.persistence.runTransaction("Apply remote event","readwrite-primary",(i=>{const a=t.ko.newChangeBuffer({trackRemovals:!0});s=t.Lo;const o=[];e.targetChanges.forEach(((l,h)=>{const d=s.get(h);if(!d)return;o.push(t.V_.removeMatchingKeys(i,l.removedDocuments,h).next((()=>t.V_.addMatchingKeys(i,l.addedDocuments,h))));let _=d.withSequenceNumber(i.currentSequenceNumber);e.targetMismatches.get(h)!==null?_=_.withResumeToken(Q.EMPTY_BYTE_STRING,b.min()).withLastLimboFreeSnapshotVersion(b.min()):l.resumeToken.approximateByteSize()>0&&(_=_.withResumeToken(l.resumeToken,n)),s=s.insert(h,_),(function(v,R,N){return v.resumeToken.approximateByteSize()===0||R.snapshotVersion.toMicroseconds()-v.snapshotVersion.toMicroseconds()>=$_?!0:N.addedDocuments.size+N.modifiedDocuments.size+N.removedDocuments.size>0})(d,_,l)&&o.push(t.V_.updateTargetData(i,_))}));let u=ee(),c=C();if(e.documentUpdates.forEach((l=>{e.resolvedLimboDocuments.has(l)&&o.push(t.persistence.referenceDelegate.updateLimboDocument(i,l))})),o.push(Q_(i,a,e.documentUpdates).next((l=>{u=l.Ko,c=l.Qo}))),!n.isEqual(b.min())){const l=t.V_.getLastRemoteSnapshotVersion(i).next((h=>t.V_.setTargetsMetadata(i,i.currentSequenceNumber,n)));o.push(l)}return m.waitFor(o).next((()=>a.apply(i))).next((()=>t.localDocuments.getLocalViewOfDocuments(i,u,c))).next((()=>u))})).then((i=>(t.Lo=s,i)))}function Q_(r,e,t){let n=C(),s=C();return t.forEach((i=>n=n.add(i))),e.getEntries(r,n).next((i=>{let a=ee();return t.forEach(((o,u)=>{const c=i.get(o);u.isFoundDocument()!==c.isFoundDocument()&&(s=s.add(o)),u.isNoDocument()&&u.version.isEqual(b.min())?(e.removeEntry(o,u.readTime),a=a.insert(o,u)):!c.isValidDocument()||u.version.compareTo(c.version)>0||u.version.compareTo(c.version)===0&&c.hasPendingWrites?(e.addEntry(u),a=a.insert(o,u)):T(Xa,"Ignoring outdated watch update for ",o,". Current version:",c.version," Watch version:",u.version)})),{Ko:a,Qo:s}}))}function j_(r,e){const t=P(r);return t.persistence.runTransaction("Get next mutation batch","readonly",(n=>(e===void 0&&(e=zt),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e))))}function Os(r,e){const t=P(r);return t.persistence.runTransaction("Allocate target","readwrite",(n=>{let s;return t.V_.getTargetData(n,e).next((i=>i?(s=i,m.resolve(s)):t.V_.allocateTargetId(n).next((a=>(s=new ze(e,a,"TargetPurposeListen",n.currentSequenceNumber),t.V_.addTargetData(n,s).next((()=>s)))))))})).then((n=>{const s=t.Lo.get(n.targetId);return(s===null||n.snapshotVersion.compareTo(s.snapshotVersion)>0)&&(t.Lo=t.Lo.insert(n.targetId,n),t.Bo.set(e,n.targetId)),n}))}async function Un(r,e,t){const n=P(r),s=n.Lo.get(e),i=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",i,(a=>n.persistence.referenceDelegate.removeTarget(a,s)))}catch(a){if(!Ct(a))throw a;T(Xa,`Failed to update sequence numbers for target ${e}: ${a}`)}n.Lo=n.Lo.remove(e),n.Bo.delete(s.target)}function ji(r,e,t){const n=P(r);let s=b.min(),i=C();return n.persistence.runTransaction("Execute query","readwrite",(a=>(function(u,c,l){const h=P(u),d=h.Bo.get(l);return d!==void 0?m.resolve(h.Lo.get(d)):h.V_.getTargetData(c,l)})(n,a,W(e)?e:xe(e)).next((o=>{if(o)return s=o.lastLimboFreeSnapshotVersion,n.V_.getMatchingKeysForTargetId(a,o.targetId).next((u=>{i=u}))})).next((()=>n.No.getDocumentsMatchingQuery(a,e,t?s:b.min(),t?i:C()))).next((o=>(eh(n,o),{documents:o,Wo:i})))))}function Zl(r,e){const t=P(r),n=P(t.V_),s=t.Lo.get(e);return s?Promise.resolve(s.target??null):t.persistence.runTransaction("Get target data","readonly",(i=>n.ye(i,e).next((a=>(a==null?void 0:a.target)??null))))}function Wi(r,e){const t=P(r),n=t.Uo.get(e)||b.min();return t.persistence.runTransaction("Get new document changes","readonly",(s=>t.ko.getAllFromCollectionGroup(s,e,Ac(n,Nn),Number.MAX_SAFE_INTEGER))).then((s=>(eh(t,s),s)))}function eh(r,e){e.forEach(((t,n)=>{const s=n.key.getCollectionGroup(),i=r.Uo.get(s)||b.min();n.readTime.compareTo(i)>0&&r.Uo.set(s,n.readTime)}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class W_{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.Yo=0,this.Zo=null,this.Xo=!0}ea(){this.Yo===0&&(this.ta("Unknown"),this.Zo=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,(()=>(this.Zo=null,this.na("Backend didn't respond within 10 seconds."),this.ta("Offline"),Promise.resolve()))))}ra(e){this.state==="Online"?this.ta("Unknown"):(this.Yo++,this.Yo>=1&&(this.ia(),this.na(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ta("Offline")))}set(e){this.ia(),this.Yo=0,e==="Online"&&(this.Xo=!1),this.ta(e)}ta(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}na(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.Xo?(H(t),this.Xo=!1):T("OnlineStateTracker",t)}ia(){this.Zo!==null&&(this.Zo.cancel(),this.Zo=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const je="RemoteStore";class H_{constructor(e,t,n,s,i){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.sa=[],this._a=new Map,this.oa=new Map,this.aa=new Map,this.ua=new it(1e3),this.ca=new it(1001),this.la=new Set,this.Ea=[],this.ha=i,this.ha.Qe((a=>{n.enqueueAndForget((async()=>{on(this)&&(T(je,"Restarting streams for network reachability change."),await(async function(u){const c=P(u);c.la.add(4),await Jr(c),c.Ta.set("Unknown"),c.la.delete(4),await ui(c)})(this))}))})),this.Ta=new W_(n,s)}}async function ui(r){if(on(r))for(const e of r.Ea)await e(!0)}async function Jr(r){for(const e of r.Ea)await e(!1)}function Hi(r,e){return r.oa.get(e)||void 0}function ci(r,e){const t=P(r),n=Hi(t,e.targetId);if(n!==void 0&&t._a.has(n))return;const s=(function(o,u){const c=Hi(o,u);c!==void 0&&o.aa.delete(c);const l=(function(d,_){return _%2!=0?d.ca.next():d.ua.next()})(o,u);return o.oa.set(u,l),o.aa.set(l,u),l})(t,e.targetId);T(je,"remoteStoreListen mapping SDK target ID to remote",e.targetId,s);const i=new ze(e.target,s,e.purpose,e.sequenceNumber,e.snapshotVersion,e.lastLimboFreeSnapshotVersion,e.resumeToken);t._a.set(s,i),to(t)?eo(t):Jn(t).Yt()&&Za(t,i)}function Bn(r,e){const t=P(r),n=Jn(t),s=Hi(t,e);T(je,"remoteStoreUnlisten removing mapping of SDK target ID to remote",e,s),t._a.delete(s),t.oa.delete(e),t.aa.delete(s),n.Yt()&&th(t,s),t._a.size===0&&(n.Yt()?n.en():on(t)&&t.Ta.set("Unknown"))}function Za(r,e){if(r.Pa.J(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(b.min())>0){const t=r.aa.get(e.targetId);if(t===void 0)return void T(je,"SDK target ID not found for remote ID: "+e.targetId);const n=r.remoteSyncer.getRemoteKeysForTarget(t).size;e=e.withExpectedCount(n)}Jn(r).Pn(e)}function th(r,e){r.Pa.J(e),Jn(r).In(e)}function eo(r){r.Pa=new Rd({getRemoteKeysForTarget:e=>{const t=r.aa.get(e);return t!==void 0?r.remoteSyncer.getRemoteKeysForTarget(t):C()},ye:e=>r._a.get(e)||null,Ve:()=>r.datastore.serializer.databaseId}),Jn(r).start(),r.Ta.ea()}function to(r){return on(r)&&!Jn(r).Jt()&&r._a.size>0}function on(r){return P(r).la.size===0}function nh(r){r.Pa=void 0}async function Y_(r){r.Ta.set("Online")}async function J_(r){r._a.forEach(((e,t)=>{Za(r,e)}))}async function X_(r,e){nh(r),to(r)?(r.Ta.ra(e),eo(r)):r.Ta.set("Unknown")}async function Z_(r,e,t){if(r.Ta.set("Online"),e instanceof Dc&&e.state===2&&e.cause)try{await(async function(s,i){const a=i.cause;for(const o of i.targetIds){if(s._a.has(o)){const u=s.aa.get(o);u!==void 0&&(await s.remoteSyncer.rejectListen(u,a),s.oa.delete(u),s.aa.delete(o)),s._a.delete(o)}s.Pa.removeTarget(o)}})(r,e)}catch(n){T(je,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await Ms(r,n)}else if(e instanceof ls?r.Pa._e(e):e instanceof Cc?r.Pa.he(e):r.Pa.ue(e),!t.isEqual(b.min()))try{const n=await Xl(r.localStore);t.compareTo(n)>=0&&await(function(i,a){const o=i.Pa.fe(a);o.targetChanges.forEach(((c,l)=>{if(c.resumeToken.approximateByteSize()>0){const h=i._a.get(l);h&&i._a.set(l,h.withResumeToken(c.resumeToken,a))}})),o.targetMismatches.forEach(((c,l)=>{const h=i._a.get(c);if(!h)return;i._a.set(c,h.withResumeToken(Q.EMPTY_BYTE_STRING,h.snapshotVersion)),th(i,c);const d=new ze(h.target,c,l,h.sequenceNumber);Za(i,d)}));const u=(function(l,h){const d=new Map;h.targetChanges.forEach(((y,v)=>{const R=l.aa.get(v);R!==void 0&&d.set(R,y)}));let _=new q(S);return h.targetMismatches.forEach(((y,v)=>{const R=l.aa.get(y);R!==void 0&&(_=_.insert(R,v))})),new Kn(h.snapshotVersion,d,_,h.documentUpdates,h.augmentedDocumentUpdates,h.resolvedLimboDocuments)})(i,o);return i.remoteSyncer.applyRemoteEvent(u)})(r,t)}catch(n){T(je,"Failed to raise snapshot:",n),await Ms(r,n)}}async function Ms(r,e,t){if(!Ct(e))throw e;r.la.add(1),await Jr(r),r.Ta.set("Offline"),t||(t=()=>Xl(r.localStore)),r.asyncQueue.enqueueRetryable((async()=>{T(je,"Retrying IndexedDB access"),await t(),r.la.delete(1),await ui(r)}))}function rh(r,e){return e().catch((t=>Ms(r,t,e)))}async function Yn(r){const e=P(r),t=Pt(e);let n=e.sa.length>0?e.sa[e.sa.length-1].batchId:zt;for(;ep(e);)try{const s=await j_(e.localStore,n);if(s===null){e.sa.length===0&&t.en();break}n=s.batchId,tp(e,s)}catch(s){await Ms(e,s)}sh(e)&&ih(e)}function ep(r){return on(r)&&r.sa.length<10}function tp(r,e){r.sa.push(e);const t=Pt(r);t.Yt()&&t.Rn&&t.An(e.mutations)}function sh(r){return on(r)&&!Pt(r).Jt()&&r.sa.length>0}function ih(r){Pt(r).start()}async function np(r){Pt(r).fn()}async function rp(r){const e=Pt(r);for(const t of r.sa)e.An(t.mutations)}async function sp(r,e,t){const n=r.sa.shift(),s=Ba.from(n,e,t);await rh(r,(()=>r.remoteSyncer.applySuccessfulWrite(s))),await Yn(r)}async function ip(r,e){e&&Pt(r).Rn&&await(async function(n,s){if((function(a){return Rc(a)&&a!==p.ABORTED})(s.code)){const i=n.sa.shift();Pt(n).Xt(),await rh(n,(()=>n.remoteSyncer.rejectFailedWrite(i.batchId,s))),await Yn(n)}})(r,e),sh(r)&&ih(r)}async function Su(r,e){const t=P(r);t.asyncQueue.verifyOperationInProgress(),T(je,"RemoteStore received new credentials");const n=on(t);t.la.add(3),await Jr(t),n&&t.Ta.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.la.delete(3),await ui(t)}async function Yi(r,e){const t=P(r);e?(t.la.delete(2),await ui(t)):e||(t.la.add(2),await Jr(t),t.Ta.set("Unknown"))}function Jn(r){return r.Ia||(r.Ia=(function(t,n,s){const i=P(t);return i.pn(),new Xd(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{ct:Y_.bind(null,r),Et:J_.bind(null,r),Tt:X_.bind(null,r),Tn:Z_.bind(null,r)}),r.Ea.push((async e=>{e?(r.Ia.Xt(),to(r)?eo(r):r.Ta.set("Unknown")):(await r.Ia.stop(),nh(r))}))),r.Ia}function Pt(r){return r.Ra||(r.Ra=(function(t,n,s){const i=P(t);return i.pn(),new Zd(n,i.connection,i.authCredentials,i.appCheckCredentials,i.serializer,s)})(r.datastore,r.asyncQueue,{ct:()=>Promise.resolve(),Et:np.bind(null,r),Tt:ip.bind(null,r),Vn:rp.bind(null,r),dn:sp.bind(null,r)}),r.Ea.push((async e=>{e?(r.Ra.Xt(),await Yn(r)):(await r.Ra.stop(),r.sa.length>0&&(T(je,`Stopping write stream with ${r.sa.length} pending writes`),r.sa=[]))}))),r.Ra}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class no{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Aa(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Aa(this.observer.error,e):H("Uncaught Error in snapshot listener:",e.toString()))}Va(){this.muted=!0}Aa(e,t){setTimeout((()=>{this.muted||e(t)}),0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ro{constructor(e,t,n,s,i){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=s,this.removalCallback=i,this.deferred=new Le,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch((a=>{}))}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,s,i){const a=Date.now()+n,o=new ro(e,t,a,s,i);return o.start(n),o}start(e){this.timerHandle=setTimeout((()=>this.handleDelayElapsed()),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new I(p.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget((()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then((e=>this.deferred.resolve(e)))):Promise.resolve()))}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function so(r,e){if(H("AsyncQueue",`${e}: ${r}`),Ct(r))return new I(p.UNAVAILABLE,`${e}: ${r}`);throw r}const gr="IndexBackfiller";class ap{constructor(e,t){this.asyncQueue=e,this.Da=t,this.task=null}start(){this.xa(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}xa(e){T(gr,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,(async()=>{this.task=null;try{const t=await this.Da.Ca();T(gr,`Documents written: ${t}`)}catch(t){Ct(t)?T(gr,"Ignoring IndexedDB error during index backfill: ",t):await St(t)}await this.xa(6e4)}))}}class op{constructor(e,t){this.localStore=e,this.persistence=t}async Ca(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",(t=>this.Fa(t,e)))}Fa(e,t){const n=new Set;let s=t,i=!0;return m.doWhile((()=>i===!0&&s>0),(()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next((a=>{if(a!==null&&!n.has(a))return T(gr,`Processing collection: ${a}`),this.Oa(e,a,s).next((o=>{s-=o,n.add(a)}));i=!1})))).next((()=>t-s))}Oa(e,t,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next((s=>this.localStore.localDocuments.getNextDocuments(e,t,s,n).next((i=>{const a=i.changes;return this.localStore.indexManager.updateIndexEntries(e,a).next((()=>this.Ma(s,i))).next((o=>(T(gr,`Updating offset: ${o}`),this.localStore.indexManager.updateCollectionGroup(e,t,o)))).next((()=>a.size))}))))}Ma(e,t){let n=e;return t.changes.forEach(((s,i)=>{const a=Vc(i);la(a,n)>0&&(n=a)})),new Se(n.readTime,n.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ah="firestore_clients";function Cu(r,e){return`${ah}_${r}_${e}`}const oh="firestore_mutations";function Du(r,e,t){let n=`${oh}_${r}_${t}`;return e.isAuthenticated()&&(n+=`_${e.uid}`),n}const uh="firestore_targets";function wi(r,e){return`${uh}_${r}_${e}`}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fe="SharedClientState";class Fs{constructor(e,t,n,s){this.user=e,this.batchId=t,this.state=n,this.error=s}static Na(e,t,n){const s=JSON.parse(n);let i,a=typeof s=="object"&&["pending","acknowledged","rejected"].indexOf(s.state)!==-1&&(s.error===void 0||typeof s.error=="object");return a&&s.error&&(a=typeof s.error.message=="string"&&typeof s.error.code=="string",a&&(i=new I(s.error.code,s.error.message))),a?new Fs(e,t,s.state,i):(H(Fe,`Failed to parse mutation state for ID '${t}': ${n}`),null)}La(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class yr{constructor(e,t,n){this.targetId=e,this.state=t,this.error=n}static Na(e,t){const n=JSON.parse(t);let s,i=typeof n=="object"&&["not-current","current","rejected"].indexOf(n.state)!==-1&&(n.error===void 0||typeof n.error=="object");return i&&n.error&&(i=typeof n.error.message=="string"&&typeof n.error.code=="string",i&&(s=new I(n.error.code,n.error.message))),i?new yr(e,n.state,s):(H(Fe,`Failed to parse target state for ID '${e}': ${t}`),null)}La(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Us{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static Na(e,t){const n=JSON.parse(t);let s=typeof n=="object"&&n.activeTargetIds instanceof Array,i=_a();for(let a=0;s&&a<n.activeTargetIds.length;++a)s=sc(n.activeTargetIds[a]),i=i.add(n.activeTargetIds[a]);return s?new Us(e,i):(H(Fe,`Failed to parse client data for instance '${e}': ${t}`),null)}}class io{constructor(e,t){this.clientId=e,this.onlineState=t}static Na(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new io(t.clientId,t.onlineState):(H(Fe,`Failed to parse online state: ${e}`),null)}}class Ji{constructor(){this.activeTargetIds=_a()}Ba(e){this.activeTargetIds=this.activeTargetIds.add(e)}Ua(e){this.activeTargetIds=this.activeTargetIds.delete(e)}La(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class Ai{constructor(e,t,n,s,i){this.window=e,this.Ct=t,this.persistenceKey=n,this.ka=s,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.qa=this.$a.bind(this),this.Ka=new q(S),this.started=!1,this.Qa=[];const a=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=i,this.Wa=Cu(this.persistenceKey,this.ka),this.Ga=(function(u){return`firestore_sequence_number_${u}`})(this.persistenceKey),this.Ka=this.Ka.insert(this.ka,new Ji),this.za=new RegExp(`^${ah}_${a}_([^_]*)$`),this.ja=new RegExp(`^${oh}_${a}_(\\d+)(?:_(.*))?$`),this.Ha=new RegExp(`^${uh}_${a}_(\\d+)$`),this.Ja=(function(u){return`firestore_online_state_${u}`})(this.persistenceKey),this.Ya=(function(u){return`firestore_bundle_loaded_v2_${u}`})(this.persistenceKey),this.window.addEventListener("storage",this.qa)}static Ye(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.Ro();for(const n of e){if(n===this.ka)continue;const s=this.getItem(Cu(this.persistenceKey,n));if(s){const i=Us.Na(n,s);i&&(this.Ka=this.Ka.insert(i.clientId,i))}}this.Za();const t=this.storage.getItem(this.Ja);if(t){const n=this.Xa(t);n&&this.eu(n)}for(const n of this.Qa)this.$a(n);this.Qa=[],this.window.addEventListener("pagehide",(()=>this.shutdown())),this.started=!0}writeSequenceNumber(e){this.setItem(this.Ga,JSON.stringify(e))}getAllActiveQueryTargets(){return this.tu(this.Ka)}isActiveQueryTarget(e){let t=!1;return this.Ka.forEach(((n,s)=>{s.activeTargetIds.has(e)&&(t=!0)})),t}addPendingMutation(e){this.nu(e,"pending")}updateMutationState(e,t,n){this.nu(e,t,n),this.ru(e)}addLocalQueryTarget(e,t=!0){let n="not-current";if(this.isActiveQueryTarget(e)){const s=this.storage.getItem(wi(this.persistenceKey,e));if(s){const i=yr.Na(e,s);i&&(n=i.state)}}return t&&this.iu.Ba(e),this.Za(),n}removeLocalQueryTarget(e){this.iu.Ua(e),this.Za()}isLocalQueryTarget(e){return this.iu.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(wi(this.persistenceKey,e))}updateQueryState(e,t,n){this.su(e,t,n)}handleUserChange(e,t,n){t.forEach((s=>{this.ru(s)})),this.currentUser=e,n.forEach((s=>{this.addPendingMutation(s)}))}setOnlineState(e){this._u(e)}notifyBundleLoaded(e){this.ou(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.qa),this.removeItem(this.Wa),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return T(Fe,"READ",e,t),t}setItem(e,t){T(Fe,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){T(Fe,"REMOVE",e),this.storage.removeItem(e)}$a(e){const t=e;if(t.storageArea===this.storage){if(T(Fe,"EVENT",t.key,t.newValue),t.key===this.Wa)return void H("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Ct.enqueueRetryable((async()=>{if(this.started){if(t.key!==null){if(this.za.test(t.key)){if(t.newValue==null){const n=this.au(t.key);return this.uu(n,null)}{const n=this.cu(t.key,t.newValue);if(n)return this.uu(n.clientId,n)}}else if(this.ja.test(t.key)){if(t.newValue!==null){const n=this.lu(t.key,t.newValue);if(n)return this.Eu(n)}}else if(this.Ha.test(t.key)){if(t.newValue!==null){const n=this.hu(t.key,t.newValue);if(n)return this.Tu(n)}}else if(t.key===this.Ja){if(t.newValue!==null){const n=this.Xa(t.newValue);if(n)return this.eu(n)}}else if(t.key===this.Ga){const n=(function(i){let a=Te.wn;if(i!=null)try{const o=JSON.parse(i);E(typeof o=="number",30636,{Pu:i}),a=o}catch(o){H(Fe,"Failed to read sequence number from WebStorage",o)}return a})(t.newValue);n!==Te.wn&&this.sequenceNumberHandler(n)}else if(t.key===this.Ya){const n=this.Iu(t.newValue);await Promise.all(n.map((s=>this.syncEngine.Ru(s))))}}}else this.Qa.push(t)}))}}get iu(){return this.Ka.get(this.ka)}Za(){this.setItem(this.Wa,this.iu.La())}nu(e,t,n){const s=new Fs(this.currentUser,e,t,n),i=Du(this.persistenceKey,this.currentUser,e);this.setItem(i,s.La())}ru(e){const t=Du(this.persistenceKey,this.currentUser,e);this.removeItem(t)}_u(e){const t={clientId:this.ka,onlineState:e};this.storage.setItem(this.Ja,JSON.stringify(t))}su(e,t,n){const s=wi(this.persistenceKey,e),i=new yr(e,t,n);this.setItem(s,i.La())}ou(e){const t=JSON.stringify(Array.from(e));this.setItem(this.Ya,t)}au(e){const t=this.za.exec(e);return t?t[1]:null}cu(e,t){const n=this.au(e);return Us.Na(n,t)}lu(e,t){const n=this.ja.exec(e),s=Number(n[1]),i=n[2]!==void 0?n[2]:null;return Fs.Na(new he(i),s,t)}hu(e,t){const n=this.Ha.exec(e),s=Number(n[1]);return yr.Na(s,t)}Xa(e){return io.Na(e)}Iu(e){return JSON.parse(e)}async Eu(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.Au(e.batchId,e.state,e.error);T(Fe,`Ignoring mutation for non-active user ${e.user.uid}`)}Tu(e){return this.syncEngine.Vu(e.targetId,e.state,e.error)}uu(e,t){const n=t?this.Ka.insert(e,t):this.Ka.remove(e),s=this.tu(this.Ka),i=this.tu(n),a=[],o=[];return i.forEach((u=>{s.has(u)||a.push(u)})),s.forEach((u=>{i.has(u)||o.push(u)})),this.syncEngine.du(a,o).then((()=>{this.Ka=n}))}eu(e){this.Ka.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}tu(e){let t=_a();return e.forEach(((n,s)=>{t=t.unionWith(s.activeTargetIds)})),t}}class ch{constructor(){this.fu=new Ji,this.mu={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.fu.Ba(e),this.mu[e]||"not-current"}updateQueryState(e,t,n){this.mu[e]=t}removeLocalQueryTarget(e){this.fu.Ua(e)}isLocalQueryTarget(e){return this.fu.activeTargetIds.has(e)}clearQueryState(e){delete this.mu[e]}getAllActiveQueryTargets(){return this.fu.activeTargetIds}isActiveQueryTarget(e){return this.fu.activeTargetIds.has(e)}start(){return this.fu=new Ji,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lh(){return typeof window<"u"?window:null}function ps(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jt{static emptySet(e){return new jt(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||A.comparator(t.key,n.key):(t,n)=>A.comparator(t.key,n.key),this.keyedMap=Lt(),this.sortedSet=new q(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal(((t,n)=>(e(t),!1)))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof jt)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const s=t.getNext().key,i=n.getNext().key;if(!s.isEqual(i))return!1}return!0}toString(){const e=[];return this.forEach((t=>{e.push(t.toString())})),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const n=new jt;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nu{constructor(){this.pu=new q(A.comparator)}track(e){const t=e.doc.key,n=this.pu.get(t);n?e.type!==0&&n.type===3?this.pu=this.pu.insert(t,e):e.type===3&&n.type!==1?this.pu=this.pu.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.pu=this.pu.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.pu=this.pu.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.pu=this.pu.remove(t):e.type===1&&n.type===2?this.pu=this.pu.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.pu=this.pu.insert(t,{type:2,doc:e.doc}):V(63341,{we:e,gu:n}):this.pu=this.pu.insert(t,e)}yu(){const e=[];return this.pu.inorderTraversal(((t,n)=>{e.push(n)})),e}}class qn{constructor(e,t,n,s,i,a,o,u,c){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=s,this.mutatedKeys=i,this.fromCache=a,this.syncStateChanged=o,this.excludesMetadataChanges=u,this.hasCachedResults=c}static fromInitialDocuments(e,t,n,s,i){const a=[];return t.forEach((o=>{a.push({type:0,doc:o})})),new qn(e,t,jt.emptySet(t),a,n,s,!0,!1,i)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Zs(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let s=0;s<t.length;s++)if(t[s].type!==n[s].type||!t[s].doc.isEqual(n[s].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class up{constructor(){this.wu=void 0,this.bu=[]}Su(){return this.bu.some((e=>e.vu()))}}class cp{constructor(){this.queries=ku(),this.onlineState="Unknown",this.Du=new Set}terminate(){(function(t,n){const s=P(t),i=s.queries;s.queries=ku(),i.forEach(((a,o)=>{for(const u of o.bu)u.onError(n)}))})(this,new I(p.ABORTED,"Firestore shutting down"))}}function ku(){return new ot((r=>Vl(r)),Zs)}async function ao(r,e){const t=P(r);let n=3;const s=e.query;let i=t.queries.get(s);i?!i.Su()&&e.vu()&&(n=2):(i=new up,n=e.vu()?0:1);try{switch(n){case 0:i.wu=await t.onListen(s,!0);break;case 1:i.wu=await t.onListen(s,!1);break;case 2:await t.onFirstRemoteStoreListen(s)}}catch(a){const o=so(a,`Initialization of query '${W(e.query)?et(e.query):lr(e.query)}' failed`);return void e.onError(o)}t.queries.set(s,i),i.bu.push(e),e.xu(t.onlineState),i.wu&&e.Cu(i.wu)&&uo(t)}async function oo(r,e){const t=P(r),n=e.query;let s=3;const i=t.queries.get(n);if(i){const a=i.bu.indexOf(e);a>=0&&(i.bu.splice(a,1),i.bu.length===0?s=e.vu()?0:1:!i.Su()&&e.vu()&&(s=2))}switch(s){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function lp(r,e){const t=P(r);let n=!1;for(const s of e){const i=s.query,a=t.queries.get(i);if(a){for(const o of a.bu)o.Cu(s)&&(n=!0);a.wu=s}}n&&uo(t)}function hp(r,e,t){const n=P(r),s=n.queries.get(e);if(s)for(const i of s.bu)i.onError(t);n.queries.delete(e)}function uo(r){r.Du.forEach((e=>{e.next()}))}var Xi;(function(r){r.Default="default",r.Cache="cache"})(Xi||(Xi={}));class co{constructor(e,t,n){this.query=e,this.Fu=t,this.Ou=!1,this.Mu=null,this.onlineState="Unknown",this.options=n||{}}Cu(e){if(!this.options.includeMetadataChanges){const n=[];for(const s of e.docChanges)s.type!==3&&n.push(s);e=new qn(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Ou?this.Nu(e)&&(this.Fu.next(e),t=!0):this.Lu(e,this.onlineState)&&(this.Bu(e),t=!0),this.Mu=e,t}onError(e){this.Fu.error(e)}xu(e){this.onlineState=e;let t=!1;return this.Mu&&!this.Ou&&this.Lu(this.Mu,e)&&(this.Bu(this.Mu),t=!0),t}Lu(e,t){if(!e.fromCache||!this.vu())return!0;const n=t!=="Offline";return(!this.options.waitForSyncWhenOnline||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Nu(e){if(e.docChanges.length>0)return!0;const t=this.Mu&&this.Mu.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}Bu(e){e=qn.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Ou=!0,this.Fu.next(e)}vu(){return this.options.source!==Xi.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hh{constructor(e){this.key=e}}class dh{constructor(e){this.key=e}}class dp{constructor(e,t){this.query=e,this.zu=t,this.ju=null,this.hasCachedResults=!1,this.current=!1,this.Hu=C(),this.mutatedKeys=C(),this.Ju=W(e)?Qi(e):ma(e),this.Yu=new jt(this.Ju)}get Zu(){return this.zu}Xu(e,t){const n=t?t.ec:new Nu,s=t?t.Yu:this.Yu;let i=t?t.mutatedKeys:this.mutatedKeys,a=s,o=!1;const[u,c]=this.tc(this.query,s);e.inorderTraversal(((h,d)=>{const _=s.get(h),y=Gl(this.query,d)?d:null,v=!!_&&this.mutatedKeys.has(_.key),R=!!y&&(y.hasLocalMutations||this.mutatedKeys.has(y.key)&&y.hasCommittedMutations);let N=!1;_&&y?_.data.isEqual(y.data)?v!==R&&(n.track({type:3,doc:y}),N=!0):this.nc(_,y)||(n.track({type:2,doc:y}),N=!0,(u&&this.Ju(y,u)>0||c&&this.Ju(y,c)<0)&&(o=!0)):!_&&y?(n.track({type:0,doc:y}),N=!0):_&&!y&&(n.track({type:1,doc:_}),N=!0,(u||c)&&(o=!0)),N&&(y?(a=a.add(y),i=R?i.add(h):i.delete(h)):(a=a.delete(h),i=i.delete(h)))}));const l=this.rc(this.query);if(l)if(W(this.query)){const h=[];a.forEach((y=>h.push(y)));const d=zl(this.query,h);let _=new jt(Qi(this.query));for(const y of d)_=_.add(y);a.forEach((y=>{_.has(y.key)||(i=i.delete(y.key),n.track({type:1,doc:y}))})),a=_}else{const h=this.sc(this.query);for(;a.size>l;){const d=h==="F"?a.last():a.first();a=a.delete(d.key),i=i.delete(d.key),n.track({type:1,doc:d})}}return{Yu:a,ec:n,Oo:o,mutatedKeys:i}}rc(e){var t;return W(e)?(t=yi(e))==null?void 0:t.limit:e.limit||void 0}sc(e){if(W(e)){const t=yi(e);return t&&t.limit<0?"L":"F"}return e.limitType}tc(e,t){var n;if(W(e)){const s=(n=yi(e))==null?void 0:n.limit;return[t.size===s?t.last():null,null]}return[e.limitType==="F"&&t.size===this.rc(this.query)?t.last():null,e.limitType==="L"&&t.size===this.rc(this.query)?t.first():null]}nc(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,s){const i=this.Yu;this.Yu=e.Yu,this.mutatedKeys=e.mutatedKeys;const a=e.ec.yu();a.sort(((l,h)=>(function(_,y){const v=R=>{switch(R){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return V(20277,{we:R})}};return v(_)-v(y)})(l.type,h.type)||this.Ju(l.doc,h.doc))),this._c(n),s=s??!1;const o=t&&!s?this.oc():[],u=this.Hu.size===0&&this.current&&!s?1:0,c=u!==this.ju;return this.ju=u,a.length!==0||c?{snapshot:new qn(this.query,e.Yu,i,a,e.mutatedKeys,u===0,c,!1,!!n&&n.resumeToken.approximateByteSize()>0),ac:o}:{ac:o}}xu(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({Yu:this.Yu,ec:new Nu,mutatedKeys:this.mutatedKeys,Oo:!1},!1)):{ac:[]}}uc(e){return!this.zu.has(e)&&!!this.Yu.has(e)&&!this.Yu.get(e).hasLocalMutations}_c(e){e&&(e.addedDocuments.forEach((t=>this.zu=this.zu.add(t))),e.modifiedDocuments.forEach((t=>{})),e.removedDocuments.forEach((t=>this.zu=this.zu.delete(t))),this.current=e.current)}oc(){if(!this.current)return[];const e=this.Hu;this.Hu=C(),this.Yu.forEach((n=>{this.uc(n.key)&&(this.Hu=this.Hu.add(n.key))}));const t=[];return e.forEach((n=>{this.Hu.has(n)||t.push(new dh(n))})),this.Hu.forEach((n=>{e.has(n)||t.push(new hh(n))})),t}cc(e){this.zu=e.Wo,this.Hu=C();const t=this.Xu(e.documents);return this.applyChanges(t,!0)}lc(){return qn.fromInitialDocuments(this.query,this.Yu,this.mutatedKeys,this.ju===0,this.hasCachedResults)}}const Xn="SyncEngine";class fp{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class mp{constructor(e){this.key=e,this.Ec=!1}}class _p{constructor(e,t,n,s,i,a){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=s,this.currentUser=i,this.maxConcurrentLimboResolutions=a,this.hc={},this.Tc=new ot((o=>Vl(o)),Zs),this.Pc=new Map,this.Ic=new Set,this.Rc=new q(A.comparator),this.Ac=new Map,this.Vc=new Wa,this.dc={},this.fc=new Map,this.mc=it.bs(),this.onlineState="Unknown",this.gc=void 0}get isPrimaryClient(){return this.gc===!0}}async function pp(r,e,t=!0){const n=li(r);let s;const i=n.Tc.get(e);return i?(n.sharedClientState.addLocalQueryTarget(i.targetId),s=i.view.lc()):s=await fh(n,e,t,!0),s}async function gp(r,e){const t=li(r);await fh(t,e,!0,!1)}async function fh(r,e,t,n){const s=await Os(r.localStore,W(e)?e:xe(e)),i=s.targetId,a=r.sharedClientState.addLocalQueryTarget(i,t);let o;return n&&(o=await lo(r,e,i,a==="current",s.resumeToken)),r.isPrimaryClient&&t&&ci(r.remoteStore,s),o}async function lo(r,e,t,n,s){r.yc=(h,d,_)=>(async function(v,R,N,k){let L=R.view.Xu(N);L.Oo&&(L=await ji(v.localStore,R.query,!1).then((({documents:ge})=>R.view.Xu(ge,L))));const re=k&&k.targetChanges.get(R.targetId),G=k&&k.targetMismatches.get(R.targetId)!=null,Z=R.view.applyChanges(L,v.isPrimaryClient,re,G);return Zi(v,R.targetId,Z.ac),Z.snapshot})(r,h,d,_);const i=await ji(r.localStore,e,!0),a=new dp(e,i.Wo),o=a.Xu(i.documents),u=Gr.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",s),c=a.applyChanges(o,r.isPrimaryClient,u);Zi(r,t,c.ac);const l=new fp(e,t,a);return r.Tc.set(e,l),r.Pc.has(t)?r.Pc.get(t).push(e):r.Pc.set(t,[e]),c.snapshot}async function yp(r,e,t){const n=P(r),s=n.Tc.get(e),i=n.Pc.get(s.targetId);if(i.length>1)return n.Pc.set(s.targetId,i.filter((a=>!Zs(a,e)))),void n.Tc.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(s.targetId),n.sharedClientState.isActiveQueryTarget(s.targetId)||await Un(n.localStore,s.targetId,!1).then((()=>{n.sharedClientState.clearQueryState(s.targetId),t&&Bn(n.remoteStore,s.targetId),$n(n,s.targetId)})).catch(St)):($n(n,s.targetId),await Un(n.localStore,s.targetId,!0))}async function Ip(r,e){const t=P(r),n=t.Tc.get(e),s=t.Pc.get(n.targetId);t.isPrimaryClient&&s.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),Bn(t.remoteStore,n.targetId))}async function Tp(r,e,t){const n=_o(r);try{const s=await(function(a,o){const u=P(a),c=F.now(),l=o.reduce(((_,y)=>_.add(y.key)),C());let h,d;return u.persistence.runTransaction("Locally write mutations","readwrite",(_=>{let y=ee(),v=C();return u.ko.getEntries(_,l).next((R=>{y=R,y.forEach(((N,k)=>{k.isValidDocument()||(v=v.add(N))}))})).next((()=>u.localDocuments.getOverlayedDocuments(_,y))).next((R=>{h=R;const N=[];for(const k of o){const L=sd(k,h.get(k.key).overlayedDocument);L!=null&&N.push(new at(k.key,L,uc(L.value.mapValue),j.exists(!0)))}return u.mutationQueue.addMutationBatch(_,c,N,o)})).next((R=>{d=R;const N=R.applyToLocalDocumentSet(h,v);return u.documentOverlayCache.saveOverlays(_,R.batchId,N)}))})).then((()=>({batchId:d.batchId,changes:xc(h)})))})(n.localStore,e);n.sharedClientState.addPendingMutation(s.batchId),(function(a,o,u){let c=a.dc[a.currentUser.toKey()];c||(c=new q(S)),c=c.insert(o,u),a.dc[a.currentUser.toKey()]=c})(n,s.batchId,t),await Dt(n,s.changes),await Yn(n.remoteStore)}catch(s){const i=so(s,"Failed to persist write");t.reject(i)}}async function mh(r,e){const t=P(r);try{const n=await K_(t.localStore,e);e.targetChanges.forEach(((s,i)=>{const a=t.Ac.get(i);a&&(E(s.addedDocuments.size+s.modifiedDocuments.size+s.removedDocuments.size<=1,22616),s.addedDocuments.size>0?a.Ec=!0:s.modifiedDocuments.size>0?E(a.Ec,14607):s.removedDocuments.size>0&&(E(a.Ec,42227),a.Ec=!1))})),await Dt(t,n,e)}catch(n){await St(n)}}function Lu(r,e,t){const n=P(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){const s=[];n.Tc.forEach(((i,a)=>{const o=a.view.xu(e);o.snapshot&&s.push(o.snapshot)})),(function(a,o){const u=P(a);u.onlineState=o;let c=!1;u.queries.forEach(((l,h)=>{for(const d of h.bu)d.xu(o)&&(c=!0)})),c&&uo(u)})(n.eventManager,e),s.length&&n.hc.Tn(s),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function Ep(r,e,t){const n=P(r);n.sharedClientState.updateQueryState(e,"rejected",t);const s=n.Ac.get(e),i=s&&s.key;if(i){let a=new q(A.comparator);a=a.insert(i,K.newNoDocument(i,b.min()));const o=C().add(i),u=new Kn(b.min(),new Map,new q(S),a,ee(),o);await mh(n,u),n.Rc=n.Rc.remove(i),n.Ac.delete(e),mo(n)}else await Un(n.localStore,e,!1).then((()=>$n(n,e,t))).catch(St)}async function wp(r,e){const t=P(r),n=e.batch.batchId;try{const s=await G_(t.localStore,e);fo(t,n,null),ho(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await Dt(t,s)}catch(s){await St(s)}}async function Ap(r,e,t){const n=P(r);try{const s=await(function(a,o){const u=P(a);return u.persistence.runTransaction("Reject batch","readwrite-primary",(c=>{let l;return u.mutationQueue.lookupMutationBatch(c,o).next((h=>(E(h!==null,37113),l=h.keys(),u.mutationQueue.removeMutationBatch(c,h)))).next((()=>u.mutationQueue.performConsistencyCheck(c))).next((()=>u.documentOverlayCache.removeOverlaysForBatchId(c,l,o))).next((()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(c,l))).next((()=>u.localDocuments.getDocuments(c,l)))}))})(n.localStore,e);fo(n,e,t),ho(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await Dt(n,s)}catch(s){await St(s)}}function ho(r,e){(r.fc.get(e)||[]).forEach((t=>{t.resolve()})),r.fc.delete(e)}function fo(r,e,t){const n=P(r);let s=n.dc[n.currentUser.toKey()];if(s){const i=s.get(e);i&&(t?i.reject(t):i.resolve(),s=s.remove(e)),n.dc[n.currentUser.toKey()]=s}}function $n(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(const n of r.Pc.get(e))r.Tc.delete(n),t&&r.hc.wc(n,t);r.Pc.delete(e),r.isPrimaryClient&&r.Vc.e_(e).forEach((n=>{r.Vc.containsKey(n)||_h(r,n)}))}function _h(r,e){r.Ic.delete(e.path.canonicalString());const t=r.Rc.get(e);t!==null&&(Bn(r.remoteStore,t),r.Rc=r.Rc.remove(e),r.Ac.delete(t),mo(r))}function Zi(r,e,t){for(const n of t)n instanceof hh?(r.Vc.addReference(n.key,e),Vp(r,n)):n instanceof dh?(T(Xn,"Document no longer in limbo: "+n.key),r.Vc.removeReference(n.key,e),r.Vc.containsKey(n.key)||_h(r,n.key)):V(19791,{bc:n})}function Vp(r,e){const t=e.key,n=t.path.canonicalString();r.Rc.get(t)||r.Ic.has(n)||(T(Xn,"New document in limbo: "+t),r.Ic.add(n),mo(r))}function mo(r){for(;r.Ic.size>0&&r.Rc.size<r.maxConcurrentLimboResolutions;){const e=r.Ic.values().next().value;r.Ic.delete(e);const t=new A(D.fromString(e)),n=r.mc.next();r.Ac.set(n,new mp(t)),r.Rc=r.Rc.insert(t,n),ci(r.remoteStore,new ze(xe(zr(t.path)),n,"TargetPurposeLimboResolution",Te.wn))}}async function Dt(r,e,t){const n=P(r),s=[],i=[],a=[];n.Tc.isEmpty()||(n.Tc.forEach(((o,u)=>{a.push(n.yc(u,e,t).then((c=>{var l;if((c||t)&&n.isPrimaryClient){const h=c?!c.fromCache:(l=t==null?void 0:t.targetChanges.get(u.targetId))==null?void 0:l.current;n.sharedClientState.updateQueryState(u.targetId,h?"current":"not-current")}if(c){s.push(c);const h=Ja.mo(u.targetId,c);i.push(h)}})))})),await Promise.all(a),n.hc.Tn(s),await(async function(u,c){const l=P(u);try{await l.persistence.runTransaction("notifyLocalViewChanges","readwrite",(h=>m.forEach(c,(d=>m.forEach(d.Vo,(_=>l.persistence.referenceDelegate.addReference(h,d.targetId,_))).next((()=>m.forEach(d.fo,(_=>l.persistence.referenceDelegate.removeReference(h,d.targetId,_)))))))))}catch(h){if(!Ct(h))throw h;T(Xa,"Failed to update sequence numbers: "+h)}for(const h of c){const d=h.targetId;if(!h.fromCache){const _=l.Lo.get(d),y=_.snapshotVersion,v=_.withLastLimboFreeSnapshotVersion(y);l.Lo=l.Lo.insert(d,v)}}})(n.localStore,i))}async function vp(r,e){const t=P(r);if(!t.currentUser.isEqual(e)){T(Xn,"User change. New user:",e.toKey());const n=await Jl(t.localStore,e);t.currentUser=e,(function(i,a){i.fc.forEach((o=>{o.forEach((u=>{u.reject(new I(p.CANCELLED,a))}))})),i.fc.clear()})(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await Dt(t,n.$o)}}function Rp(r,e){const t=P(r),n=t.Ac.get(e);if(n&&n.Ec)return C().add(n.key);{let s=C();const i=t.Pc.get(e);if(!i)return s;for(const a of i??[]){const o=t.Tc.get(a);s=s.unionWith(o.view.Zu)}return s}}async function Pp(r,e){const t=P(r),n=await ji(t.localStore,e.query,!0),s=e.view.cc(n);return t.isPrimaryClient&&Zi(t,e.targetId,s.ac),s}async function bp(r,e){const t=P(r);return Wi(t.localStore,e).then((n=>Dt(t,n)))}async function xp(r,e,t,n){const s=P(r),i=await(function(o,u){const c=P(o),l=P(c.mutationQueue);return c.persistence.runTransaction("Lookup mutation documents","readonly",(h=>l.Wr(h,u).next((d=>d?c.localDocuments.getDocuments(h,d):m.resolve(null)))))})(s.localStore,e);i!==null?(t==="pending"?await Yn(s.remoteStore):t==="acknowledged"||t==="rejected"?(fo(s,e,n||null),ho(s,e),(function(o,u){P(P(o).mutationQueue).Hr(u)})(s.localStore,e)):V(6720,"Unknown batchState",{Sc:t}),await Dt(s,i)):T(Xn,"Cannot apply mutation batch with id: "+e)}async function Sp(r,e){const t=P(r);if(li(t),_o(t),e===!0&&t.gc!==!0){const n=t.sharedClientState.getAllActiveQueryTargets(),s=await Ou(t,n.toArray());t.gc=!0,await Yi(t.remoteStore,!0);for(const i of s)ci(t.remoteStore,i)}else if(e===!1&&t.gc!==!1){const n=[];let s=Promise.resolve();t.Pc.forEach(((i,a)=>{t.sharedClientState.isLocalQueryTarget(a)?n.push(a):s=s.then((()=>($n(t,a),Un(t.localStore,a,!0)))),Bn(t.remoteStore,a)})),await s,await Ou(t,n),(function(a){const o=P(a);o.Ac.forEach(((u,c)=>{Bn(o.remoteStore,c)})),o.Vc.t_(),o.Ac=new Map,o.Rc=new q(A.comparator)})(t),t.gc=!1,await Yi(t.remoteStore,!1)}}async function Ou(r,e,t){const n=P(r),s=[],i=[];for(const a of e){let o;const u=n.Pc.get(a);if(u&&u.length!==0){o=await Os(n.localStore,W(u[0])?u[0]:xe(u[0]));for(const c of u){const l=n.Tc.get(c),h=await Pp(n,l);h.snapshot&&i.push(h.snapshot)}}else{const c=await Zl(n.localStore,a);o=await Os(n.localStore,c),await lo(n,ph(c),a,!1,o.resumeToken)}s.push(o)}return n.hc.Tn(i),s}function ph(r){return Je(r)?r:vc(r.path,r.collectionGroup,r.orderBy,r.filters,r.limit,"F",r.startAt,r.endAt)}function Cp(r){return(function(t){return P(P(t).persistence).Ro()})(P(r).localStore)}async function Dp(r,e,t,n){const s=P(r);if(s.gc)return void T(Xn,"Ignoring unexpected query state notification.");const i=s.Pc.get(e);if(i&&i.length>0)switch(t){case"current":case"not-current":{let a;if(W(i[0]))switch(Ze(i[0])){case"collection_group":case"collection":a=await Wi(s.localStore,gl(i[0]));break;case"documents":a=await(function(c,l){const h=P(c),d=C(...Ps(l).map((_=>A.fromPath(_))));return h.persistence.runTransaction("Get documents for pipeline","readonly",(_=>h.ko.getEntries(_,d))).then((_=>_))})(s.localStore,i[0]);break;default:Oe(""),a=Lt()}else a=await Wi(s.localStore,(function(c){return c.collectionGroup||(c.path.length%2==1?c.path.lastSegment():c.path.get(c.path.length-2))})(i[0]));const o=Kn.createSynthesizedRemoteEventForCurrentChange(e,t==="current",Q.EMPTY_BYTE_STRING);await Dt(s,a,o);break}case"rejected":await Un(s.localStore,e,!0),$n(s,e,n);break;default:V(64155,t)}}async function Np(r,e,t){const n=li(r);if(n.gc){for(const s of e){if(n.Pc.has(s)&&n.sharedClientState.isActiveQueryTarget(s)){T(Xn,"Adding an already active target "+s);continue}const i=await Zl(n.localStore,s),a=await Os(n.localStore,i);await lo(n,ph(i),a.targetId,!1,a.resumeToken),ci(n.remoteStore,a)}for(const s of t)n.Pc.has(s)&&await Un(n.localStore,s,!1).then((()=>{Bn(n.remoteStore,s),$n(n,s)})).catch(St)}}function li(r){const e=P(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=mh.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=Rp.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=Ep.bind(null,e),e.hc.Tn=lp.bind(null,e.eventManager),e.hc.wc=hp.bind(null,e.eventManager),e}function _o(r){const e=P(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=wp.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=Ap.bind(null,e),e}class kr{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Qs(e.databaseInfo.databaseId),this.sharedClientState=this.vc(e),this.persistence=this.Dc(e),await this.persistence.start(),this.localStore=this.xc(e),this.gcScheduler=this.Cc(e,this.localStore),this.indexBackfillerScheduler=this.Fc(e,this.localStore)}Cc(e,t){return null}Fc(e,t){return null}xc(e){return Yl(this.persistence,new Hl,e.initialUser,this.serializer)}Dc(e){return new Ha(oi.b_,this.serializer)}vc(e){return new ch}async terminate(){var e,t;(e=this.gcScheduler)==null||e.stop(),(t=this.indexBackfillerScheduler)==null||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}kr.provider={build:()=>new kr};class kp extends kr{constructor(e){super(),this.cacheSizeBytes=e}Cc(e,t){E(this.persistence.referenceDelegate instanceof Ls,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new el(n,e.asyncQueue,t)}Dc(e){const t=this.cacheSizeBytes!==void 0?de.withCacheSize(this.cacheSizeBytes):de.DEFAULT;return new Ha((n=>Ls.b_(n,t)),this.serializer)}}class gh extends kr{constructor(e,t,n){super(),this.Oc=e,this.cacheSizeBytes=t,this.forceOwnership=n,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.Oc.initialize(this,e),await _o(this.Oc.syncEngine),await Yn(this.Oc.remoteStore),await this.persistence.eo((()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve())))}xc(e){return Yl(this.persistence,new Hl,e.initialUser,this.serializer)}Cc(e,t){const n=this.persistence.referenceDelegate.garbageCollector;return new el(n,e.asyncQueue,t)}Fc(e,t){const n=new op(t,this.persistence);return new ap(e.asyncQueue,n)}Dc(e){const t=Wl(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),n=this.cacheSizeBytes!==void 0?de.withCacheSize(this.cacheSizeBytes):de.DEFAULT;return new Ya(this.synchronizeTabs,t,e.clientId,n,e.asyncQueue,lh(),ps(),this.serializer,this.sharedClientState,!!this.forceOwnership)}vc(e){return new ch}}class Lp extends gh{constructor(e,t){super(e,t,!1),this.Oc=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.Oc.syncEngine;this.sharedClientState instanceof Ai&&(this.sharedClientState.syncEngine={Au:xp.bind(null,t),Vu:Dp.bind(null,t),du:Np.bind(null,t),Ro:Cp.bind(null,t),Ru:bp.bind(null,t)},await this.sharedClientState.start()),await this.persistence.eo((async n=>{await Sp(this.Oc.syncEngine,n),this.gcScheduler&&(n&&!this.gcScheduler.started?this.gcScheduler.start():n||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(n&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():n||this.indexBackfillerScheduler.stop())}))}vc(e){const t=lh();if(!Ai.Ye(t))throw new I(p.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=Wl(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new Ai(t,e.asyncQueue,n,e.clientId,e.initialUser)}}class Lr{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>Lu(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=vp.bind(null,this.syncEngine),await Yi(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return(function(){return new cp})()}createDatastore(e){const t=Qs(e.databaseInfo.databaseId),n=Jd(e.databaseInfo);return nf(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return(function(n,s,i,a,o){return new H_(n,s,i,a,o)})(this.localStore,this.datastore,e.asyncQueue,(t=>Lu(this.syncEngine,t,0)),(function(){return Xo.Ye()?new Xo:new jd})())}createSyncEngine(e,t){return(function(s,i,a,o,u,c,l){const h=new _p(s,i,a,o,u,c);return l&&(h.gc=!0),h})(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await(async function(s){const i=P(s);T(je,"RemoteStore shutting down."),i.la.add(5),await Jr(i),i.ha.shutdown(),i.Ta.set("Unknown")})(this.remoteStore),(e=this.datastore)==null||e.terminate(),(t=this.eventManager)==null||t.terminate()}}Lr.provider={build:()=>new Lr};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Op=class{constructor(e){this.datastore=e,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(e){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new I(p.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const t=await(async function(s,i){const a=P(s),o={documents:i.map((h=>kn(a.serializer,h)))},u=await a._t("BatchGetDocuments",a.serializer.databaseId,D.emptyPath(),o,i.length),c=new Map;u.forEach((h=>{const d=Dd(a.serializer,h);c.set(d.key.toString(),d)}));const l=[];return i.forEach((h=>{const d=c.get(h.toString());E(!!d,55234,{key:h}),l.push(d)})),l})(this.datastore,e);return t.forEach((n=>this.recordVersion(n))),t}set(e,t){this.write(t.toMutation(e,this.precondition(e))),this.writtenDocs.add(e.toString())}update(e,t){try{this.write(t.toMutation(e,this.preconditionForUpdate(e)))}catch(n){this.lastTransactionError=n}this.writtenDocs.add(e.toString())}delete(e){this.write(new $r(e,this.precondition(e))),this.writtenDocs.add(e.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const e=this.readVersions;this.mutations.forEach((t=>{e.delete(t.key.toString())})),e.forEach(((t,n)=>{const s=A.fromPath(n);this.mutations.push(new ua(s,this.precondition(s)))})),await(async function(n,s){const i=P(n),a={writes:s.map((o=>Vr(i.serializer,o)))};await i.nt("Commit",i.serializer.databaseId,D.emptyPath(),a)})(this.datastore,this.mutations),this.committed=!0}recordVersion(e){let t;if(e.isFoundDocument())t=e.version;else{if(!e.isNoDocument())throw V(50498,{Mc:e.constructor.name});t=b.min()}const n=this.readVersions.get(e.key.toString());if(n){if(!t.isEqual(n))throw new I(p.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(e.key.toString(),t)}precondition(e){const t=this.readVersions.get(e.toString());return!this.writtenDocs.has(e.toString())&&t?t.isEqual(b.min())?j.exists(!1):j.updateTime(t):j.none()}preconditionForUpdate(e){const t=this.readVersions.get(e.toString());if(!this.writtenDocs.has(e.toString())&&t){if(t.isEqual(b.min()))throw new I(p.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return j.updateTime(t)}return j.exists(!0)}write(e){this.ensureCommitNotCalled(),this.mutations.push(e)}ensureCommitNotCalled(){}};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mp{constructor(e,t,n,s,i){this.asyncQueue=e,this.datastore=t,this.options=n,this.updateFunction=s,this.deferred=i,this.Nc=n.maxAttempts,this.Ht=new Ia(this.asyncQueue,"transaction_retry")}Lc(){this.Nc-=1,this.Bc()}Bc(){this.Ht.kt((async()=>{const e=new Op(this.datastore),t=this.Uc(e);t&&t.then((n=>{this.asyncQueue.enqueueAndForget((()=>e.commit().then((()=>{this.deferred.resolve(n)})).catch((s=>{this.kc(s)}))))})).catch((n=>{this.kc(n)}))}))}Uc(e){try{const t=this.updateFunction(e);return!qr(t)&&t.catch&&t.then?t:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(t){return this.deferred.reject(t),null}}kc(e){this.Nc>0&&this.qc(e)?(this.Nc-=1,this.asyncQueue.enqueueAndForget((()=>(this.Bc(),Promise.resolve())))):this.deferred.reject(e)}qc(e){if((e==null?void 0:e.name)==="FirebaseError"){const t=e.code;return t==="aborted"||t==="failed-precondition"||t==="already-exists"||!Rc(t)}return!1}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bt="FirestoreClient";class Fp{constructor(e,t,n,s,i){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this._databaseInfo=s,this.user=he.UNAUTHENTICATED,this.clientId=na.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=i,this.authCredentials.start(n,(async a=>{T(bt,"Received user=",a.uid),await this.authCredentialListener(a),this.user=a})),this.appCheckCredentials.start(n,(a=>(T(bt,"Received new app check token=",a),this.appCheckCredentialListener(a,this.user))))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new Le;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted((async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=so(t,"Failed to shutdown persistence");e.reject(n)}})),e.promise}}async function Vi(r,e){r.asyncQueue.verifyOperationInProgress(),T(bt,"Initializing OfflineComponentProvider");const t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener((async s=>{n.isEqual(s)||(await Jl(e.localStore,s),n=s)})),e.persistence.setDatabaseDeletedListener((()=>r.terminate())),r._offlineComponents=e}async function Mu(r,e){r.asyncQueue.verifyOperationInProgress();const t=await Up(r);T(bt,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener((n=>Su(e.remoteStore,n))),r.setAppCheckTokenChangeListener(((n,s)=>Su(e.remoteStore,s))),r._onlineComponents=e}async function Up(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){T(bt,"Using user provided OfflineComponentProvider");try{await Vi(r,r._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!(function(s){return s.name==="FirebaseError"?s.code===p.FAILED_PRECONDITION||s.code===p.UNIMPLEMENTED:!(typeof DOMException<"u"&&s instanceof DOMException)||s.code===22||s.code===20||s.code===11})(t))throw t;Oe("Error using user provided cache. Falling back to memory cache: "+t),await Vi(r,new kr)}}else T(bt,"Using default OfflineComponentProvider"),await Vi(r,new kp(void 0));return r._offlineComponents}async function po(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(T(bt,"Using user provided OnlineComponentProvider"),await Mu(r,r._uninitializedComponentsProvider._online)):(T(bt,"Using default OnlineComponentProvider"),await Mu(r,new Lr))),r._onlineComponents}function Bp(r){return po(r).then((e=>e.syncEngine))}function qp(r){return po(r).then((e=>e.datastore))}async function Bs(r){const e=await po(r),t=e.eventManager;return t.onListen=pp.bind(null,e.syncEngine),t.onUnlisten=yp.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=gp.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=Ip.bind(null,e.syncEngine),t}function $p(r,e,t,n){const s=new no(n),i=new co(e,s,t);return r.asyncQueue.enqueueAndForget((async()=>ao(await Bs(r),i))),()=>{s.Va(),r.asyncQueue.enqueueAndForget((async()=>oo(await Bs(r),i)))}}function yh(r,e,t={}){const n=new Le;return r.asyncQueue.enqueueAndForget((async()=>(function(i,a,o,u,c){const l=new no({next:d=>{l.Va(),a.enqueueAndForget((()=>oo(i,h)));const _=d.docs.has(o);!_&&d.fromCache?c.reject(new I(p.UNAVAILABLE,"Failed to get document because the client is offline.")):_&&d.fromCache&&u&&u.source==="server"?c.reject(new I(p.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):c.resolve(d)},error:d=>c.reject(d)}),h=new co(zr(o.path),l,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return ao(i,h)})(await Bs(r),r.asyncQueue,e,t,n))),n.promise}function zp(r,e,t={}){const n=new Le;return r.asyncQueue.enqueueAndForget((async()=>(function(i,a,o,u,c){const l=new no({next:d=>{l.Va(),a.enqueueAndForget((()=>oo(i,h))),d.fromCache&&u.source==="server"?c.reject(new I(p.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):c.resolve(d)},error:d=>c.reject(d)}),h=new co(o instanceof fr?Bm(o):o,l,{includeMetadataChanges:!0,waitForSyncWhenOnline:!0});return ao(i,h)})(await Bs(r),r.asyncQueue,e,t,n))),n.promise}function Gp(r,e){const t=new Le;return r.asyncQueue.enqueueAndForget((async()=>Tp(await Bp(r),e,t))),t.promise}function Kp(r,e,t){const n=new Le;return r.asyncQueue.enqueueAndForget((async()=>{const s=await qp(r);new Mp(r.asyncQueue,s,t,e,n).Lc()})),n.promise}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Or=class{constructor(e,t,n,s,i){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=s,this._converter=i}get id(){return this._key.path.lastSegment()}get ref(){return new z(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new Qp(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const t=this._document.data.field(rt("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}},Qp=class extends Or{data(){return super.data()}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ih{convertValue(e,t="none"){switch(X(e)){case 0:return null;case 1:return e.booleanValue;case 2:return $(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(nt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw V(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return xt(e,((s,i)=>{n[s]=this.convertValue(i,t)})),n}convertVectorValue(e){var n,s,i;const t=(i=(s=(n=e.fields)==null?void 0:n[Jt].arrayValue)==null?void 0:s.values)==null?void 0:i.map((a=>$(a.doubleValue)));return new Ee(t)}convertGeoPoint(e){return new Ke($(e.latitude),$(e.longitude))}convertArray(e,t){return(e.values||[]).map((n=>this.convertValue(n,t)))}convertServerTimestamp(e,t){switch(t){case"previous":const n=Br(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(vn(e));default:return null}}convertTimestamp(e){const t=tt(e);return new F(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=D.fromString(e);E(Gc(n),9688,{name:e});const s=new Yt(n.get(1),n.get(3)),i=new A(n.popFirst(5));return s.isEqual(t)||H(`A document reference to ${i} refers to a different database (${s.projectId}/${s.database}), which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),i}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function go(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}class jp extends Ih{constructor(e){super(),this.firestore=e}convertBytes(e){return new Pe(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new z(this.firestore,null,t)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fu="AsyncQueue";class Uu{constructor(e=Promise.resolve()){this.$c=[],this.Kc=!1,this.Qc=[],this.Wc=null,this.Gc=!1,this.zc=!1,this.jc=[],this.Ht=new Ia(this,"async_queue_retry"),this.Hc=()=>{const n=ps();n&&T(Fu,"Visibility state changed to "+n.visibilityState),this.Ht.$t()},this.Jc=e;const t=ps();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this.Hc)}get isShuttingDown(){return this.Kc}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.Yc(),this.Zc(e)}enterRestrictedMode(e){if(!this.Kc){this.Kc=!0,this.zc=e||!1;const t=ps();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this.Hc)}}enqueue(e){if(this.Yc(),this.Kc)return new Promise((()=>{}));const t=new Le;return this.Zc((()=>this.Kc&&this.zc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise))).then((()=>t.promise))}enqueueRetryable(e){this.enqueueAndForget((()=>(this.$c.push(e),this.Xc())))}async Xc(){if(this.$c.length!==0){try{await this.$c[0](),this.$c.shift(),this.Ht.reset()}catch(e){if(!Ct(e))throw e;T(Fu,"Operation failed with retryable error: "+e)}this.$c.length>0&&this.Ht.kt((()=>this.Xc()))}}Zc(e){const t=this.Jc.then((()=>(this.Gc=!0,e().catch((n=>{throw this.Wc=n,this.Gc=!1,H("INTERNAL UNHANDLED ERROR: ",Bu(n)),n})).then((n=>(this.Gc=!1,n))))));return this.Jc=t,t}enqueueAfterDelay(e,t,n){this.Yc(),this.jc.indexOf(e)>-1&&(t=0);const s=ro.createAndSchedule(this,e,t,n,(i=>this.el(i)));return this.Qc.push(s),s}Yc(){this.Wc&&V(47125,{tl:Bu(this.Wc)})}verifyOperationInProgress(){}async nl(){let e;do e=this.Jc,await e;while(e!==this.Jc)}rl(e){for(const t of this.Qc)if(t.timerId===e)return!0;return!1}il(e){return this.nl().then((()=>{this.Qc.sort(((t,n)=>t.targetTimeMs-n.targetTimeMs));for(const t of this.Qc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.nl()}))}sl(e){this.jc.push(e)}el(e){const t=this.Qc.indexOf(e);this.Qc.splice(t,1)}}function Bu(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _g=-1;class We extends Ea{constructor(e,t,n,s){super(e,t,n,s),this.type="firestore",this._queue=new Uu,this._persistenceKey=(s==null?void 0:s.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Uu(e),this._firestoreClient=void 0,await e}}}function pg(r,e,t){t||(t=Ts);const n=vh(r,"firestore");if(n.isInitialized(t)){const s=n.getImmediate({identifier:t}),i=n.getOptions(t);if(Rh(i,e))return s;throw new I(p.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new I(p.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Zc)throw new I(p.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&Qu(e.host)&&Ph(e.host),n.initialize({options:e,instanceIdentifier:t})}function un(r){if(r._terminated)throw new I(p.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||Wp(r),r._firestoreClient}function Wp(r){var n,s,i,a;const e=r._freezeSettings(),t=sf(r._databaseId,((n=r._app)==null?void 0:n.options.appId)||"",r._persistenceKey,(s=r._app)==null?void 0:s.options.apiKey,e);r._componentsProvider||(i=e.localCache)!=null&&i._offlineComponentProvider&&((a=e.localCache)!=null&&a._onlineComponentProvider)&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new Fp(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&(function(u){const c=u==null?void 0:u._online.build();return{_offline:u==null?void 0:u._offline.build(c),_online:c}})(r._componentsProvider))}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hi extends Ih{constructor(e){super(),this.firestore=e}convertBytes(e){return new Pe(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new z(this.firestore,null,t)}}class En{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class It extends Or{constructor(e,t,n,s,i,a){super(e,t,n,s,a),this._firestore=e,this._firestoreImpl=e,this.metadata=i}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new gs(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(rt("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new I(p.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=It._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}It._jsonSchemaVersion="firestore/documentSnapshot/1.0",It._jsonSchema={type:J("string",It._jsonSchemaVersion),bundleSource:J("string","DocumentSnapshot"),bundleName:J("string"),bundle:J("string")};class gs extends It{data(e={}){return super.data(e)}}class Wt{constructor(e,t,n,s){this._firestore=e,this._userDataWriter=t,this._snapshot=s,this.metadata=new En(s.hasPendingWrites,s.fromCache),this.query=n}get docs(){const e=[];return this.forEach((t=>e.push(t))),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach((n=>{e.call(t,new gs(this._firestore,this._userDataWriter,n.key,n,new En(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))}))}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new I(p.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=(function(s,i){if(s._snapshot.oldDocs.isEmpty()){let a=0;return s._snapshot.docChanges.map((o=>{W(s._snapshot.query)?Qi(s._snapshot.query):ma(s.query._query);const u=new gs(s._firestore,s._userDataWriter,o.doc.key,o.doc,new En(s._snapshot.mutatedKeys.has(o.doc.key),s._snapshot.fromCache),s.query.converter);return o.doc,{type:"added",doc:u,oldIndex:-1,newIndex:a++}}))}{let a=s._snapshot.oldDocs;return s._snapshot.docChanges.filter((o=>i||o.type!==3)).map((o=>{const u=new gs(s._firestore,s._userDataWriter,o.doc.key,o.doc,new En(s._snapshot.mutatedKeys.has(o.doc.key),s._snapshot.fromCache),s.query.converter);let c=-1,l=-1;return o.type!==0&&(c=a.indexOf(o.doc.key),a=a.delete(o.doc.key)),o.type!==1&&(a=a.add(o.doc),l=a.indexOf(o.doc.key)),{type:Hp(o.type),doc:u,oldIndex:c,newIndex:l}}))}})(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new I(p.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=Wt._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=na.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],s=[];return this.docs.forEach((i=>{i._document!==null&&(t.push(i._document),n.push(this._userDataWriter.convertObjectMap(i._document.data.value.mapValue.fields,"previous")),s.push(i.ref.path))})),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function Hp(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return V(61501,{type:r})}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Wt._jsonSchemaVersion="firestore/querySnapshot/1.0",Wt._jsonSchema={type:J("string",Wt._jsonSchemaVersion),bundleSource:J("string","QuerySnapshot"),bundleName:J("string"),bundle:J("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Th(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new I(p.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class yo{}class di extends yo{}function gg(r,e,...t){let n=[];e instanceof yo&&n.push(e),n=n.concat(t),(function(i){const a=i.filter((u=>u instanceof Io)).length,o=i.filter((u=>u instanceof fi)).length;if(a>1||a>0&&o>0)throw new I(p.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")})(n);for(const s of n)r=s._apply(r);return r}class fi extends di{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new fi(e,t,n)}_apply(e){const t=this._parse(e);return Eh(e._query,t),new He(e.firestore,e.converter,Di(e._query,t))}_parse(e){const t=jn(e.firestore);return(function(i,a,o,u,c,l,h){let d;if(c.isKeyField()){if(l==="array-contains"||l==="array-contains-any")throw new I(p.INVALID_ARGUMENT,`Invalid Query. You can't perform '${l}' queries on documentId().`);if(l==="in"||l==="not-in"){$u(h,l);const y=[];for(const v of h)y.push(qu(u,i,v));d={arrayValue:{values:y}}}else d=qu(u,i,h)}else l!=="in"&&l!=="not-in"&&l!=="array-contains-any"||$u(h,l),d=sl(o,a,h,l==="in"||l==="not-in");return O.create(c,l,d)})(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function yg(r,e,t){const n=e,s=rt("where",r);return fi._create(s,n,t)}class Io extends yo{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new Io(e,t)}_parse(e){const t=this._queryConstraints.map((n=>n._parse(e))).filter((n=>n.getFilters().length>0));return t.length===1?t[0]:B.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:((function(s,i){let a=s;const o=i.getFlattenedFilters();for(const u of o)Eh(a,u),a=Di(a,u)})(e._query,t),new He(e.firestore,e.converter,Di(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class To extends di{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new To(e,t)}_apply(e){const t=(function(s,i,a){if(s.startAt!==null)throw new I(p.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(s.endAt!==null)throw new I(p.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new wr(i,a)})(e._query,this._field,this._direction);return new He(e.firestore,e.converter,_d(e._query,t))}}function Ig(r,e="asc"){const t=e,n=rt("orderBy",r);return To._create(n,t)}class Eo extends di{constructor(e,t,n){super(),this.type=e,this._limit=t,this._limitType=n}static _create(e,t,n){return new Eo(e,t,n)}_apply(e){return new He(e.firestore,e.converter,vs(e._query,this._limit,this._limitType))}}function Tg(r){return Qh("limit",r),Eo._create("limit",r,"F")}class wo extends di{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new wo(e,t,n)}_apply(e){const t=Yp(e,this.type,this._docOrFields,this._inclusive);return new He(e.firestore,e.converter,pd(e._query,t))}}function Eg(...r){return wo._create("startAfter",r,!1)}function Yp(r,e,t,n){if(t[0]=we(t[0]),t[0]instanceof Or)return(function(i,a,o,u,c){if(!u)throw new I(p.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${o}().`);const l=[];for(const h of wn(i))if(h.field.isKeyField())l.push(Xt(a,u.key));else{const d=u.data.field(h.field);if(Ur(d))throw new I(p.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+h.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(d===null){const _=h.field.canonicalString();throw new I(p.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${_}' (used as the orderBy) does not exist.`)}l.push(d)}return new wt(l,c)})(r._query,r.firestore._databaseId,e,t[0]._document,n);{const s=jn(r.firestore);return(function(a,o,u,c,l,h){const d=a.explicitOrderBy;if(l.length>d.length)throw new I(p.INVALID_ARGUMENT,`Too many arguments provided to ${c}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const _=[];for(let y=0;y<l.length;y++){const v=l[y];if(d[y].field.isKeyField()){if(typeof v!="string")throw new I(p.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${c}(), but got a ${typeof v}`);if(!fa(a)&&v.indexOf("/")!==-1)throw new I(p.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${c}() must be a plain document ID, but '${v}' contains a slash.`);const R=a.path.child(D.fromString(v));if(!A.isDocumentKey(R))throw new I(p.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${c}() must result in a valid document path, but '${R}' is not because it contains an odd number of segments.`);const N=new A(R);_.push(Xt(o,N))}else{const R=sl(u,c,v);_.push(R)}}return new wt(_,h)})(r._query,r.firestore._databaseId,s,e,t,n)}}function qu(r,e,t){if(typeof(t=we(t))=="string"){if(t==="")throw new I(p.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!fa(e)&&t.indexOf("/")!==-1)throw new I(p.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const n=e.path.child(D.fromString(t));if(!A.isDocumentKey(n))throw new I(p.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return Xt(r,new A(n))}if(t instanceof z)return Xt(r,t._key);throw new I(p.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${qs(t)}.`)}function $u(r,e){if(!Array.isArray(r)||r.length===0)throw new I(p.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function Eh(r,e){const t=(function(s,i){for(const a of s)for(const o of a.getFlattenedFilters())if(i.indexOf(o.op)>=0)return o.op;return null})(r.filters,(function(s){switch(s){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}})(e.op));if(t!==null)throw t===e.op?new I(p.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new I(p.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zu(r){return(function(t,n){if(typeof t!="object"||t===null)return!1;const s=t;for(const i of n)if(i in s&&typeof s[i]=="function")return!0;return!1})(r,["next","error","complete"])}class Jp{constructor(e){let t;this.kind="persistent",e!=null&&e.tabManager?(e.tabManager._initialize(e),t=e.tabManager):(t=eg(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}function wg(r){return new Jp(r)}class Xp{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=Lr.provider,this._offlineComponentProvider={build:t=>new gh(t,e==null?void 0:e.cacheSizeBytes,this.forceOwnership)}}}class Zp{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=Lr.provider,this._offlineComponentProvider={build:t=>new Lp(t,e==null?void 0:e.cacheSizeBytes)}}}function eg(r){return new Xp(r==null?void 0:r.forceOwnership)}function Ag(){return new Zp}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tg={maxAttempts:5};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ng{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=jn(e)}set(e,t,n){this._verifyNotCommitted();const s=_t(e,this._firestore),i=go(s.converter,t,n),a=Aa(this._dataReader,"WriteBatch.set",s._key,i,s.converter!==null,n);return this._mutations.push(a.toMutation(s._key,j.none())),this}update(e,t,n,...s){this._verifyNotCommitted();const i=_t(e,this._firestore);let a;return a=typeof(t=we(t))=="string"||t instanceof Qn?Ra(this._dataReader,"WriteBatch.update",i._key,t,n,s):va(this._dataReader,"WriteBatch.update",i._key,t),this._mutations.push(a.toMutation(i._key,j.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=_t(e,this._firestore);return this._mutations=this._mutations.concat(new $r(t._key,j.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new I(p.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function _t(r,e){if((r=we(r)).firestore!==e)throw new I(p.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rg=class{constructor(e,t){this._firestore=e,this._transaction=t,this._dataReader=jn(e)}get(e){const t=_t(e,this._firestore),n=new jp(this._firestore);return this._transaction.lookup([t._key]).then((s=>{if(!s||s.length!==1)return V(24041);const i=s[0];if(i.isFoundDocument())return new Or(this._firestore,n,i.key,i,t.converter);if(i.isNoDocument())return new Or(this._firestore,n,t._key,null,t.converter);throw V(18433,{doc:i})}))}set(e,t,n){const s=_t(e,this._firestore),i=go(s.converter,t,n),a=Aa(this._dataReader,"Transaction.set",s._key,i,s.converter!==null,n);return this._transaction.set(s._key,a),this}update(e,t,n,...s){const i=_t(e,this._firestore);let a;return a=typeof(t=we(t))=="string"||t instanceof Qn?Ra(this._dataReader,"Transaction.update",i._key,t,n,s):va(this._dataReader,"Transaction.update",i._key,t),this._transaction.update(i._key,a),this}delete(e){const t=_t(e,this._firestore);return this._transaction.delete(t._key),this}};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sg extends rg{constructor(e,t){super(e,t),this._firestore=e}get(e){const t=_t(e,this._firestore),n=new hi(this._firestore);return super.get(e).then((s=>new It(this._firestore,n,t._key,s._document,new En(!1,!1),t.converter)))}}function vg(r,e,t){r=ye(r,We);const n={...tg,...t};(function(a){if(a.maxAttempts<1)throw new I(p.INVALID_ARGUMENT,"Max attempts must be at least 1")})(n);const s=un(r);return Kp(s,(i=>e(new sg(r,i))),n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rg(r){r=ye(r,z);const e=ye(r.firestore,We),t=un(e);return yh(t,r._key).then((n=>Vo(e,r,n)))}function Pg(r){r=ye(r,z);const e=ye(r.firestore,We),t=un(e);return yh(t,r._key,{source:"server"}).then((n=>Vo(e,r,n)))}function bg(r){r=ye(r,He);const e=ye(r.firestore,We),t=un(e),n=new hi(e);return Th(r._query),zp(t,r._query).then((s=>new Wt(e,n,r,s)))}function xg(r,e,t){r=ye(r,z);const n=ye(r.firestore,We),s=go(r.converter,e,t),i=jn(n);return Ao(n,[Aa(i,"setDoc",r._key,s,r.converter!==null,t).toMutation(r._key,j.none())])}function Sg(r,e,t,...n){r=ye(r,z);const s=ye(r.firestore,We),i=jn(s);let a;return a=typeof(e=we(e))=="string"||e instanceof Qn?Ra(i,"updateDoc",r._key,e,t,n):va(i,"updateDoc",r._key,e),Ao(s,[a.toMutation(r._key,j.exists(!0))])}function Cg(r,...e){var c,l,h;r=we(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||zu(e[n])||(t=e[n++]);const s={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(zu(e[n])){const d=e[n];e[n]=(c=d.next)==null?void 0:c.bind(d),e[n+1]=(l=d.error)==null?void 0:l.bind(d),e[n+2]=(h=d.complete)==null?void 0:h.bind(d)}let i,a,o;if(r instanceof z)a=ye(r.firestore,We),o=zr(r._key.path),i={next:d=>{e[n]&&e[n](Vo(a,r,d))},error:e[n+1],complete:e[n+2]};else{const d=ye(r,He);a=ye(d.firestore,We),o=d._query;const _=new hi(a);i={next:y=>{e[n]&&e[n](new Wt(a,_,d,y))},error:e[n+1],complete:e[n+2]},Th(r._query)}const u=un(a);return $p(u,o,s,i)}function Ao(r,e){const t=un(r);return Gp(t,e)}function Vo(r,e,t){const n=t.docs.get(e._key),s=new hi(r);return new It(r,s,e._key,n,new En(t.hasPendingWrites,t.fromCache),e.converter)}function Dg(r){return r=ye(r,We),un(r),new ng(r,(e=>Ao(r,e)))}const Gu="@firebase/firestore",Ku="4.17.2";(function(e,t=!0){Uh(Dh),Sh(new Ch("firestore",((n,{instanceIdentifier:s,options:i})=>{const a=n.getProvider("app").getImmediate(),o=new We(new zd(n.getProvider("auth-internal")),new Qd(a,n.getProvider("app-check-internal")),Hh(a,s),a);return i={useFetchStreams:t,...i},o._setSettings(i),o}),"PUBLIC").setMultipleInstances(!0)),vo(Gu,Ku,e),vo(Gu,Ku,"esm2020")})();export{F as T,bg as a,hg as b,cg as c,lg as d,Ig as e,Eg as f,Rg as g,Dg as h,Pg as i,pg as j,Ag as k,Tg as l,Cg as o,wg as p,gg as q,vg as r,xg as s,Sg as u,yg as w,_g as y};
