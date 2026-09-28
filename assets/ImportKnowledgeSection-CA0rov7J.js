import{c as x,u as Y,L as P,b as U,T as B,H}from"./index-n5Cgp26l.js";import{r as a,j as e}from"./vendor-react-1oUQXqo_.js";import"./vendor-fsrs-B4XpkUnX.js";import"./vendor-firestore-7_C05k9J.js";/**
 * @license lucide-react v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],ue=x("chevron-right",K);/**
 * @license lucide-react v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],W=x("copy",Q);/**
 * @license lucide-react v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],Z=x("eye-off",X);/**
 * @license lucide-react v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],te=x("eye",ee);/**
 * @license lucide-react v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],oe=x("lock",re);/**
 * @license lucide-react v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],xe=x("plus",se);/**
 * @license lucide-react v0.564.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=[["path",{d:"M12 3v12",key:"1x0j5s"}],["path",{d:"m17 8-5-5-5 5",key:"7q97r8"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}]],ne=x("upload",ae);function ie(o){return JSON.stringify(o,null,2)}function le(o){const d={domains:o.domains.map(({id:p,name:l})=>({id:p,name:l})),topics:o.topics.map(({id:p,domainId:l,name:f})=>({id:p,domainId:l,name:f})),subtopics:o.subtopics.map(({id:p,topicId:l,name:f})=>({id:p,topicId:l,name:f})),allowedTags:[...o.allowedTags]};return`You are generating study material for MindSpark.

The user will provide source/study material together with these instructions.
Use only facts supported by that source material. Do not fabricate unsupported facts.

Return EXACTLY ONE valid JSON object that can be pasted directly into MindSpark.
Output JSON only:
- no Markdown code fences;
- no prose before or after the JSON;
- no comments;
- no unsupported or unknown keys.

MindSpark uses a strict schema. Extra fields are rejected.

TOP-LEVEL SHAPE

{
  "item": {
    "title": "...",
    "content": "...",
    "taxonomy": {
      "domainId": "...",
      "topicId": "..."
    }
  },
  "cards": [
    {
      "type": "free_recall",
      "prompt": "...",
      "answerGuidance": "..."
    }
  ]
}

Only "item" and "cards" are allowed at the top level.

ITEM CONTRACT

Required:
- "title": non-empty string
- "content": non-empty string
- "taxonomy": valid taxonomy reference

Optional:
- "blocks"
- "explanationMarkdown"
- "tags"
- "sources"

Do NOT generate IDs, knowledgeItemId, timestamps, createdAt, updatedAt,
schemaVersion, status, lifecycle state, FSRS data, scheduler state,
review history/events, suspension state, image references, storage paths,
Firebase metadata, or any other unsupported field.

TAXONOMY

Use ONLY IDs listed in the authoritative taxonomy below.

Rules:
- "domainId" must reference an existing domain.
- "topicId" must reference a topic belonging to that domain.
- "subtopicId" is optional; when present it must belong to the selected topic.
- Tags are optional and must come only from "allowedTags".
- Never invent or auto-create taxonomy IDs or tags.

Authoritative current taxonomy:
${ie(d)}

CONTENT BLOCKS

"blocks" is optional. When present it must be a non-empty ordered array.
Preserve the intended order of the study material.

Allowed block forms only:

Text:
{
  "type": "text",
  "content": "..."
}

Code:
{
  "type": "code",
  "language": "optional-language-name",
  "content": "..."
}

Math:
{
  "type": "math",
  "content": "..."
}

Block content must not be blank.
For code blocks, "language" is optional.

SOURCES

"sources" is optional. Each source object may contain only:
{
  "title": "optional non-empty title",
  "url": "optional valid URL",
  "citation": "optional non-empty citation"
}

REVIEW CARDS

"cards" must contain at least one card.

Create high-quality retrieval practice.
Avoid unnecessary duplicate cards that test the same fact in nearly the same way.

Allowed card types and exact shapes:

1. Free recall
{
  "type": "free_recall",
  "prompt": "...",
  "answerGuidance": "..."
}

2. Flashcard
{
  "type": "flashcard",
  "front": "...",
  "back": "..."
}

3. Multiple choice
{
  "type": "mcq",
  "question": "...",
  "options": ["...", "..."],
  "correctOptionIndex": 0,
  "explanation": "optional explanation"
}

MCQ rules:
- at least 2 options;
- every option must be non-empty;
- options must be unique case-insensitively after trimming;
- "correctOptionIndex" is zero-based;
- "correctOptionIndex" must identify an existing option.

4. True / false
{
  "type": "true_false",
  "statement": "...",
  "isTrue": true,
  "explanation": "optional explanation"
}

5. Cloze
{
  "type": "cloze",
  "prompt": "...",
  "answer": "..."
}

QUALITY RULES

- Base the item and cards only on the user's supplied source/study material.
- Prefer questions that require meaningful retrieval rather than trivial wording changes.
- Keep each card focused on a coherent retrieval target.
- Avoid generating several cards that merely repeat the same fact.
- Use "explanationMarkdown" when a useful explanatory synthesis is supported.
- Use ordered text/code/math blocks when structure materially helps preserve the source.
- Do not insert placeholders where the supplied source provides the actual value.
- Do not add unsupported metadata.

FINAL OUTPUT RULE

Return exactly one JSON object matching this contract and nothing else.`}function F(o){return o!=null&&o.issues&&Array.isArray(o.issues)?o.issues.map(d=>`${d.path.length>0?d.path.join(".")+": ":""}${d.message}`).join("; "):typeof(o==null?void 0:o.message)=="string"?o.message:"Invalid import packet"}const he=({debounceMs:o=400})=>{const{inspectImportPacket:d,importPacket:p,taxonomyService:l,refreshCount:f,isSignedOut:N,isUnconfigured:E,isEphemeralDev:M}=Y(),[k,A]=a.useState(""),[c,n]=a.useState("empty"),[r,m]=a.useState(null),[_,i]=a.useState(null),[R,C]=a.useState(null),[u,q]=a.useState(null),[S,L]=a.useState(null),[b,J]=a.useState(!1),[I,T]=a.useState("idle"),g=a.useRef(0),h=a.useRef(null);a.useEffect(()=>{let t=!1;return q(null),L(null),T("idle"),l.getRegistry().then(s=>{t||q(le(s))}).catch(s=>{t||L(s instanceof Error?s.message:"Unable to load the current taxonomy registry.")}),()=>{t=!0}},[l,f]),a.useEffect(()=>()=>{h.current&&clearTimeout(h.current)},[]);const $=t=>{const s=t.target.value;A(s),C(null),h.current&&(clearTimeout(h.current),h.current=null);const y=++g.current,v=s.trim();if(!v){n("empty"),m(null),i(null);return}n("inspecting"),m(null),i(null),h.current=setTimeout(async()=>{try{let w;try{w=JSON.parse(v)}catch(G){if(y!==g.current)return;n("invalid"),m(null),i(`Invalid JSON: ${G.message}`);return}const j=await d(w);if(y!==g.current)return;j.ok?(n("ready"),m(j),i(null)):j.status==="duplicate"&&(n("duplicate"),m(j),i(null))}catch(w){if(y!==g.current)return;n("invalid"),m(null),i(F(w))}},o)},O=N||E&&!M,D=async()=>{var t;if(u)try{if(!((t=navigator.clipboard)!=null&&t.writeText))throw new Error("Clipboard access is unavailable in this browser context.");await navigator.clipboard.writeText(u),T("copied")}catch{T("error")}},V=async()=>{if(!(O||c!=="ready"||!k.trim())){n("importing"),i(null),C(null);try{const t=JSON.parse(k),s=await p(t);n("imported"),C(`Successfully imported "${s.knowledgeItem.title}" with ${s.cards.length} review card${s.cards.length===1?"":"s"} added.`),A(""),m(null),i(null)}catch(t){H(t)?(n("duplicate"),i(null)):(n("invalid"),i(F(t)))}}},z=c!=="ready"||O;return e.jsxs("div",{className:"bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl p-6 paper-shadow",children:[e.jsx("h3",{className:"font-semibold text-lg font-ui mb-1",children:"Import Knowledge Packet"}),e.jsx("p",{className:"text-sm text-[var(--muted-color)] font-content mb-4",children:"Paste a valid MindSpark JSON packet adhering to the schema specification."}),e.jsxs("section",{className:"mb-5 rounded-xl border border-[var(--border-color)] bg-[var(--elevated-color)] p-4","aria-labelledby":"create-with-ai-heading",children:[e.jsxs("div",{className:"flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx("h4",{id:"create-with-ai-heading",className:"font-semibold text-sm font-ui",children:"Create with AI"}),e.jsx("p",{className:"text-xs text-[var(--muted-color)] font-content leading-relaxed",children:"Copy MindSpark's generation prompt, give it to ChatGPT or another chatbot together with your study material, then paste the returned JSON below."})]}),e.jsxs("div",{className:"flex flex-wrap gap-2 shrink-0",children:[e.jsxs("button",{type:"button",onClick:D,disabled:!u,className:"inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] text-xs font-medium font-ui hover:border-[var(--color-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",children:[e.jsx(W,{className:"w-3.5 h-3.5"}),I==="copied"?"Copied":"Copy generation prompt"]}),e.jsxs("button",{type:"button",onClick:()=>J(t=>!t),disabled:!u,"aria-expanded":b,className:"inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] text-xs font-medium font-ui hover:border-[var(--color-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",children:[b?e.jsx(Z,{className:"w-3.5 h-3.5"}):e.jsx(te,{className:"w-3.5 h-3.5"}),b?"Hide prompt":"View prompt"]})]})]}),e.jsxs("ol",{className:"mt-3 ml-4 list-decimal space-y-1 text-xs text-[var(--muted-color)] font-content",children:[e.jsx("li",{children:"Copy the MindSpark generation prompt."}),e.jsx("li",{children:"Send it with the source or study material you want converted."}),e.jsx("li",{children:"Paste the chatbot's JSON-only response into the import box below."})]}),!u&&!S&&e.jsxs("div",{className:"mt-3 flex items-center gap-2 text-xs text-[var(--muted-color)] font-ui",children:[e.jsx(P,{className:"w-3.5 h-3.5 animate-spin"}),"Loading current taxonomy for the generation prompt..."]}),S&&e.jsxs("div",{className:"mt-3 rounded-lg bg-[var(--color-soft-error)] p-3 text-xs text-[var(--color-error)] font-ui",role:"alert",children:["Generation prompt unavailable: ",S]}),I==="copied"&&e.jsxs("div",{className:"mt-3 flex items-center gap-2 text-xs text-[var(--color-success)] font-ui",role:"status",children:[e.jsx(U,{className:"w-3.5 h-3.5"}),"Generation prompt copied to clipboard."]}),I==="error"&&e.jsx("div",{className:"mt-3 rounded-lg bg-[var(--color-soft-error)] p-3 text-xs text-[var(--color-error)] font-ui",role:"alert",children:"Could not copy automatically. Use View prompt and copy it manually."}),b&&u&&e.jsx("pre",{"aria-label":"MindSpark generation prompt",className:"mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border-color)] bg-[var(--bg-color)] p-3 text-[11px] leading-relaxed font-mono",children:u})]}),O&&e.jsxs("div",{className:"p-3.5 mb-4 bg-[var(--color-soft-warning)] text-[var(--color-warning)] rounded-xl border border-[var(--color-warning)] text-xs flex items-center gap-2.5 font-ui",role:"status",children:[e.jsx(oe,{className:"w-4 h-4 shrink-0 text-amber-600"}),e.jsx("span",{children:N?e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:"Authentication required:"})," Sign in to import and persist knowledge packets in your personal library."]}):e.jsxs(e.Fragment,{children:[e.jsx("strong",{children:"Configuration required:"})," Firebase Firestore is not configured. Cloud persistence is unavailable and library imports are disabled in this state."]})})]}),e.jsx("textarea",{rows:6,value:k,onChange:$,"aria-label":"MindSpark JSON packet",placeholder:'{"item": {"title": "...", "content": "...", "taxonomy": {...}}, "cards": [...]}',className:"w-full p-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl text-xs font-mono font-content mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"}),c==="inspecting"&&e.jsxs("div",{className:"flex items-center gap-2 text-xs text-[var(--muted-color)] font-ui py-2 mb-4","aria-live":"polite",children:[e.jsx(P,{className:"w-3.5 h-3.5 animate-spin text-[var(--color-primary)]"}),e.jsx("span",{children:"Inspecting packet..."})]}),c==="duplicate"&&e.jsxs("div",{className:"p-4 mb-4 bg-[var(--color-soft-attention)] text-[var(--color-attention)] rounded-xl border border-[var(--color-attention)] text-xs space-y-2 font-content",role:"alert",children:[e.jsxs("div",{className:"flex items-center gap-2 font-semibold font-ui text-sm text-[var(--color-error)]",children:[e.jsx(B,{className:"w-4 h-4 shrink-0"}),e.jsx("span",{children:"Already in your library"})]}),e.jsx("p",{className:"text-xs text-[var(--text-color)]",children:"An item with this title and taxonomy already exists."}),r&&e.jsxs("div",{className:"pt-2 border-t border-[var(--border-color)] text-[11px] font-mono text-[var(--muted-color)]",children:[e.jsxs("div",{children:["Title: ",r.preview.title]}),e.jsxs("div",{children:["Taxonomy: ",r.preview.taxonomy.domainId," →"," ",r.preview.taxonomy.topicId,r.preview.taxonomy.subtopicId?` → ${r.preview.taxonomy.subtopicId}`:""]})]})]}),c==="invalid"&&_&&e.jsx("div",{className:"p-3 mb-4 bg-[var(--color-soft-error)] text-[var(--color-error)] rounded-lg text-xs font-mono",role:"alert",children:_}),c==="ready"&&r&&e.jsxs("div",{className:"space-y-4 pt-2 mb-4 border-t border-[var(--border-color)]",children:[e.jsxs("div",{className:"space-y-2 bg-[var(--elevated-color)] p-4 rounded-xl border border-[var(--border-color)]",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] font-ui",children:"Inspection Preview"}),e.jsx("span",{className:"px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-soft-success)] text-[var(--color-success)] font-ui",children:"Ready to Import"})]}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-semibold text-base text-[var(--text-color)] font-ui",children:r.preview.title}),e.jsxs("div",{className:"text-xs text-[var(--muted-color)] font-mono mt-0.5",children:[r.preview.taxonomy.domainId," → ",r.preview.taxonomy.topicId,r.preview.taxonomy.subtopicId?` → ${r.preview.taxonomy.subtopicId}`:""]})]}),e.jsxs("div",{className:"flex flex-wrap gap-2 pt-1 text-xs font-ui",children:[e.jsxs("span",{className:"px-2 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)] font-medium",children:[r.preview.cardCount," ",r.preview.cardCount===1?"card":"cards"]}),e.jsxs("span",{className:"px-2 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--muted-color)]",children:[r.preview.sourceCount," ",r.preview.sourceCount===1?"source":"sources"]}),r.preview.tags.length>0?r.preview.tags.map(t=>e.jsxs("span",{className:"px-2 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--muted-color)]",children:["#",t]},t)):e.jsx("span",{className:"px-2 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)] text-[var(--muted-color)]",children:"No tags"})]}),e.jsxs("div",{className:"flex flex-wrap gap-3 pt-1 text-xs text-[var(--muted-color)] font-ui",children:[r.preview.cardTypeCounts.free_recall>0&&e.jsxs("span",{children:["Free Recall: ",r.preview.cardTypeCounts.free_recall]}),r.preview.cardTypeCounts.flashcard>0&&e.jsxs("span",{children:["Flashcard: ",r.preview.cardTypeCounts.flashcard]}),r.preview.cardTypeCounts.mcq>0&&e.jsxs("span",{children:["MCQ: ",r.preview.cardTypeCounts.mcq]}),r.preview.cardTypeCounts.true_false>0&&e.jsxs("span",{children:["True/False: ",r.preview.cardTypeCounts.true_false]}),r.preview.cardTypeCounts.cloze>0&&e.jsxs("span",{children:["Cloze: ",r.preview.cardTypeCounts.cloze]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("h5",{className:"text-xs font-semibold uppercase tracking-wider text-[var(--muted-color)] font-ui",children:["Cards (",r.normalizedDraft.cards.length,")"]}),e.jsx("div",{className:"space-y-2 max-h-72 overflow-y-auto pr-1",children:r.normalizedDraft.cards.map((t,s)=>e.jsxs("div",{className:"p-3 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg text-xs space-y-1.5 font-content",children:[e.jsxs("div",{className:"flex items-center justify-between font-ui",children:[e.jsxs("span",{className:"font-semibold text-[var(--text-color)]",children:["Card ",s+1]}),e.jsx("span",{className:"capitalize px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--elevated-color)] border border-[var(--border-color)] text-[var(--muted-color)]",children:t.type.replace("_"," ")})]}),t.type==="mcq"&&e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{className:"font-medium text-[var(--text-color)]",children:t.question}),e.jsx("ul",{className:"pl-2 space-y-0.5 text-[var(--muted-color)]",children:t.options.map((y,v)=>e.jsxs("li",{className:v===t.correctOptionIndex?"text-[var(--color-success)] font-medium":"",children:[v===t.correctOptionIndex?"✓ ":"• ",y]},v))}),e.jsxs("div",{className:"text-[11px] text-[var(--color-success)] font-ui",children:["Correct: ",t.options[t.correctOptionIndex]]}),t.explanation&&e.jsx("div",{className:"text-[11px] text-[var(--muted-color)] italic",children:t.explanation})]}),t.type==="true_false"&&e.jsxs("div",{className:"space-y-1",children:[e.jsx("p",{className:"font-medium text-[var(--text-color)]",children:t.statement}),e.jsxs("div",{className:"text-[11px] font-ui text-[var(--color-success)]",children:["Correct: ",t.isTrue?"True":"False"]}),t.explanation&&e.jsx("div",{className:"text-[11px] text-[var(--muted-color)] italic",children:t.explanation})]}),t.type==="flashcard"&&e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"font-semibold font-ui text-[var(--muted-color)]",children:["Front:"," "]}),t.front]}),e.jsxs("div",{children:[e.jsxs("span",{className:"font-semibold font-ui text-[var(--muted-color)]",children:["Back:"," "]}),t.back]})]}),t.type==="free_recall"&&e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"font-semibold font-ui text-[var(--muted-color)]",children:["Prompt:"," "]}),t.prompt]}),e.jsxs("div",{children:[e.jsxs("span",{className:"font-semibold font-ui text-[var(--muted-color)]",children:["Guidance:"," "]}),t.answerGuidance]})]}),t.type==="cloze"&&e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"font-semibold font-ui text-[var(--muted-color)]",children:["Prompt:"," "]}),t.prompt]}),e.jsxs("div",{children:[e.jsxs("span",{className:"font-semibold font-ui text-[var(--muted-color)]",children:["Answer:"," "]}),t.answer]})]})]},s))})]})]}),R&&e.jsxs("div",{className:"p-3 mb-4 bg-[var(--color-soft-success)] text-[var(--color-success)] rounded-lg text-sm flex items-center gap-2 font-ui",role:"status",children:[e.jsx(U,{className:"w-4 h-4 shrink-0"}),e.jsx("span",{children:R})]}),e.jsxs("button",{onClick:V,disabled:z,title:N?"Authentication required: Sign in to import packets":E&&!M?"Configuration required: Persistence unavailable":void 0,className:"inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-text)] rounded-xl font-medium font-ui hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed",children:[c==="importing"?e.jsx(P,{className:"w-4 h-4 animate-spin"}):e.jsx(ne,{className:"w-4 h-4"}),c==="importing"?"Validating & Importing...":"Import Packet"]})]})};export{ue as C,he as I,oe as L,xe as P,ne as U};
