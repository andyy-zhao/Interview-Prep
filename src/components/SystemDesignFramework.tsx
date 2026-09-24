const steps = [
  { title: 'Requirements', prompt: 'Agree on what the system must do and the constraints it must meet.', questions: ['Which user journeys are in scope? What is out of scope?', 'What scale, latency, availability, and consistency do we need?'] },
  { title: 'Core Entities', prompt: 'Name the main things the system stores or works with.', questions: ['What are the core objects, identifiers, and relationships?', 'What information must each entity contain?'] },
  { title: 'API or Interface', prompt: 'Define how users and services interact with the system.', questions: ['What operations support the agreed user journeys?', 'What inputs, outputs, and error cases matter?'] },
  { title: 'Data Flow', prompt: 'Trace how data moves through the system when it helps clarify the design.', questions: ['What happens from request or event to final result?', 'Which steps are synchronous, asynchronous, or repeated?'] },
  { title: 'High-level Design', prompt: 'Build a clear end-to-end design that satisfies the functional requirements.', questions: ['Which services, stores, and connections are necessary?', 'Can you walk through each core user journey on the diagram?'] },
  { title: 'Deep Dives', prompt: 'Return to the non-functional requirements and strengthen the design.', questions: ['Where are the bottlenecks and failure modes?', 'Which tradeoffs improve scale, latency, reliability, or consistency?'] },
];
export default function SystemDesignFramework() {
 return <section className="design-framework" aria-label="System design interview framework">
   <div className="section-heading"><div><h2>A repeatable path through the interview</h2><p>Start with requirements. Make it work, then make it meet the constraints.</p></div><a className="external-link" href="/reference/system-design-framework.png" target="_blank" rel="noreferrer">Open original diagram ↗</a></div>
   <figure className="framework-diagram"><img src="/reference/system-design-framework.png" alt="Six-step framework: Requirements → Core Entities → API or Interface → Data Flow → High-level Design → Deep Dives. High-level design checks back against functional requirements; deep dives check back against non-functional requirements."/><figcaption>Your reference diagram. Use the prompts below as a quick companion.</figcaption></figure>
   <div className="framework-goals"><p><strong>High-level design → functional requirements</strong><br/>Does the system do what we agreed it should?</p><p><strong>Deep dives → non-functional requirements</strong><br/>Does it meet the required scale and quality constraints?</p></div>
   <ol className="framework-steps">{steps.map((step,i)=><li className="story-section" key={step.title}><div className="framework-step-heading"><span>{i+1}</span><h3>{step.title}</h3></div><p>{step.prompt}</p><ul>{step.questions.map(q=><li key={q}>{q}</li>)}</ul></li>)}</ol>
 </section>;
}
