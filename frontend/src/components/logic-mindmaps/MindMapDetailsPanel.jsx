import React from "react";

function Section({ title, children }) {
  return (
    <section className="logic-map-section">
      <div className="logic-map-section-label">{title}</div>
      <div className="logic-map-section-content">{children || "—"}</div>
    </section>
  );
}

function ListSection({ title, items, ordered = false }) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <Section title={title}>
      {items?.length ? (
        <ListTag className="logic-map-section-list">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ListTag>
      ) : (
        "—"
      )}
    </Section>
  );
}

export default function MindMapDetailsPanel({ node }) {
  const payload = node?.data?.payload;

  if (!node || !payload) {
    return <div className="logic-map-details">Selectează un nod.</div>;
  }

  return (
    <div className="logic-map-details">
      <div className="logic-map-details-label">Detalii nod</div>
      <h2 className="logic-map-details-title">{payload.label || node.data.label}</h2>

      <Section title="Rezumat">
        <p className="logic-map-details-summary">{payload.summary || "—"}</p>
      </Section>

      <Section title="Lecția / locul în examen">
        <p>{payload.lesson || "—"}</p>
      </Section>

      <ListSection title="Ce trebuie să înveți" items={payload.learn} />
      <ListSection title="Cum se rezolvă" items={payload.solve} ordered />

      <Section title="Exemplu corect">
        <div className="logic-map-example-claim">{payload.good?.statement || "—"}</div>
        {payload.good?.explanation ? <div>{payload.good.explanation}</div> : null}
      </Section>

      <Section title="Exemplu greșit / capcană">
        <div className="logic-map-example-claim">{payload.trap?.statement || "—"}</div>
        {payload.trap?.explanation ? <div>{payload.trap.explanation}</div> : null}
      </Section>

      <Section title="Explicație">
        <p>{payload.explanation || payload.summary || "—"}</p>
      </Section>

      <Section title="Unde apare">
        {payload.where?.length ? (
          <div className="logic-map-chip-list">
            {payload.where.map((item, index) => (
              <span className="logic-map-chip" key={index}>
                {item}
              </span>
            ))}
          </div>
        ) : (
          "—"
        )}
      </Section>
    </div>
  );
}
