import React, { useEffect, useState } from "react";
import "./style.css";

import yaml from "js-yaml";
import * as markdown from "marked";
import DOMPurify from "dompurify";
import TextareaAutosize from "react-textarea-autosize";

function initialDoc() {
  return {
    focus: null,
    header: "# header",
    summary: "some summary of intent",
    sidebar: ["## section 1\nsomething", "## section 2\nsomething else"],
    body: [
      {
        title: "# work",
        rows: [
          { header: "### some employer", content: "- some bullet points" },
          {
            header: "### some other employer",
            content: "- some bullet points"
          }
        ]
      }
    ]
  };
}

function generateHtml(md) {
  if (!md) {
    return {};
  }
  return {
    dangerouslySetInnerHTML: {
      __html: markdown.default(md, {
        sanitizeFunction: DOMPurify.sanitize
      })
    }
  };
}

function MarkdownArea({
  content,
  setContent,
  isFocused,
  setFocus,
  clearFocus,
  className = ""
}) {
  if (isFocused) {
    return (
      <div className={`${className}`}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onBlur={clearFocus}
          onHeightChange={(height, { rowHeight }) => {
            console.log(rowHeight);
          }}
        />
      </div>
    );
  }
  return (
    <div
      className={`${className} markdown`}
      onClick={setFocus}
      {...generateHtml(content)}
    />
  );
}

function Header({ header, setHeader, useFocus }) {
  const focus = useFocus("header");
  return (
    <div className="header">
      <MarkdownArea content={header} setContent={setHeader} {...focus} />
    </div>
  );
}

function Summary({ summary, setSummary, useFocus }) {
  const focus = useFocus("summary");
  return (
    <MarkdownArea
      className="summary"
      content={summary}
      setContent={setSummary}
      {...focus}
    />
  );
}

function Sidebar({ sidebar, setSidebar, useFocus }) {
  return (
    <div className="sidebar">
      {sidebar.map((item, index) => (
        <MarkdownArea
          content={item}
          setContent={content =>
            setSidebar(sidebar => {
              if (content === "DELETE") {
                return [
                  ...sidebar.slice(0, index),
                  ...sidebar.slice(index + 1)
                ];
              } else {
                return [
                  ...sidebar.slice(0, index),
                  content,
                  ...sidebar.slice(index + 1)
                ];
              }
            })
          }
          {...useFocus(`sidebar[${index}]`)}
          className="sidebarItem"
        />
      ))}
    </div>
  );
}

function ContentSection({ title, items }) {
  return null;

  // <div className="section">
  //   <h2>{title}</h2>
  //   <div className="sectionBlock">
  //     {items.map(item => (
  //       <div className="block">
  //         <div className="blockLeft">
  //           <div {...generateHtml(item.sidebar)} />
  //         </div>
  //         <div className="blockRight" {...generateHtml(item.content)} />
  //       </div>
  //     ))}t
  //   </div>
  // </div>
}

function Content({ content }) {
  return (
    <div className="content">
      {content.map(section => (
        <ContentSection {...section} />
      ))}
    </div>
  );
}

function Body({ doc, setDoc, useFocus }) {
  return (
    <div className="body">
      <Sidebar
        sidebar={doc.sidebar}
        setSidebar={updateFn => {
          setDoc(doc => ({ ...doc, sidebar: updateFn(doc.sidebar) }));
        }}
        useFocus={useFocus}
      />
    </div>
  );
}

function Resume({ doc, setDoc }) {
  const useFocus = path => {
    return {
      isFocused: doc.focus === path,
      setFocus: () => setDoc(doc => ({ ...doc, focus: path })),
      clearFocus: () => setDoc(doc => ({ ...doc, focus: null }))
    };
  };

  return (
    <div className="resume">
      <Header
        header={doc.header}
        setHeader={header => setDoc(doc => ({ ...doc, header }))}
        useFocus={useFocus}
      />
      <Summary
        summary={doc.summary}
        setSummary={summary => setDoc(doc => ({ ...doc, summary }))}
        useFocus={useFocus}
      />
      <Body doc={doc} setDoc={setDoc} useFocus={useFocus} />
    </div>
  );
}

function ControlPanel({ doc, setDoc }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    console.log("xxx");
    document.addEventListener("keyup", e => {
      console.log(e);
    });
  }, []);

  if (!visible) {
    return null;
  }
  return (
    <div>
      <button
        className="newButton"
        onClick={() =>
          setDoc(doc => ({ ...doc, sidebar: [...doc.sidebar, "NEW_ITEM"] }))
        }
      >
        Add SidebarItem
      </button>
    </div>
  );
}

export default function App() {
  const [doc, setDoc] = useState(null);
  useEffect(() => {
    if (doc != null) {
      return;
    }
    const cached = window.localStorage.getItem("resume-cache-0");
    if (cached) {
      try {
        const doc = JSON.parse(cached);
        setDoc({ ...doc, focus: null });
      } catch (e) {
        console.error("error loading doc");
        console.error(e);
        setDoc(initialDoc());
      }
    } else {
      setDoc(initialDoc());
    }
  }, [doc]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.localStorage.setItem("resume-cache-0", JSON.stringify(doc));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [doc]);

  return doc ? <Resume doc={doc} setDoc={setDoc} /> : null;
}
