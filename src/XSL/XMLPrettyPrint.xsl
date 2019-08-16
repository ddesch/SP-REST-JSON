<?xml version="1.0"?>
<!-- This Source Code Form is subject to the terms of the Mozilla Public
   - License, v. 2.0. If a copy of the MPL was not distributed with this
   - file, You can obtain one at http://mozilla.org/MPL/2.0/. -->

<!-- <!DOCTYPE overlay [
  <!ENTITY % prettyPrintDTD SYSTEM "./prettyprint.dtd">
  %prettyPrintDTD;
  <!ENTITY % globalDTD SYSTEM "./global.dtd">
  %globalDTD;
]> -->
<!DOCTYPE overlay [
  <!ENTITY xml.nostylesheet "Mit dieser XML-Datei sind anscheinend keine Style-Informationen verknüpft. Nachfolgend wird die Baum-Ansicht des Dokuments angezeigt.">
  <!ENTITY locale.dir "ltr">
]>


<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns="http://www.w3.org/1999/xhtml">

  <xsl:output method="xml"/>

  <xsl:template match="/">
    <div id="top">
      <!-- <link rel="stylesheet" href="XMLPrettyPrint.css"/> -->
      <style>
        @charset "UTF-8";
        /* This Source Code Form is subject to the terms of the Mozilla Public
        * License, v. 2.0. If a copy of the MPL was not distributed with this
        * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

        @namespace url(http://www.w3.org/1999/xhtml); /* set default namespace to HTML */

        *|*:root {
          background-color: white;
          color: black;
          direction: ltr;
          -moz-control-character-visibility: visible;
          height: 100%;
        }
        #viewsource {
          font-family: -moz-fixed;
          font-weight: normal;
          white-space: pre;
          counter-reset: line;
          height: 100%;
          box-sizing: border-box;
          margin: 0;
          padding: 8px;
        }
        #viewsource.wrap {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        pre {
          font: inherit;
          color: inherit;
          white-space: inherit;
          margin: 0 0 0 5ch;
        }
        pre[id]:before,
        span[id]:before {
          content: counter(line) " ";
          counter-increment: line;
          -moz-user-select: none;
          display: inline-block;
          width: 5ch;
          margin: 0 0 0 -5ch;
          text-align: right;
          color: #ccc;
          font-weight: normal;
          font-style: normal;
        }
        .highlight .start-tag {
        color: purple;
        font-weight: bold;
        }
        .highlight .end-tag {
        color: purple;
        font-weight: bold;
        }
        .highlight .comment {
        color: green;
        font-style: italic;
        }
        .highlight .cdata {
        color: #CC0066;
        }
        .highlight .doctype {
        color: steelblue;
        font-style: italic;
        }
        .highlight .pi {
        color: orchid;
        font-style: italic;
        }
        .highlight .entity {
        color: #FF4500;
        font-weight: normal;
        }
        .highlight .text {
          font-weight: normal;
        }
        .highlight .attribute-name {
        color: black;
        font-weight: bold;
        }
        .highlight .attribute-value {
        color: blue;
        font-weight: normal;
        }
        .highlight .markupdeclaration {
        color: steelblue;
        font-style: italic;
        }
        span:not(.error), a:not(.error) {
        unicode-bidi: embed;
        }
        span[id] {
        unicode-bidi: isolate;
        }
        .highlight .error,
        .highlight .error > :-moz-any(.start-tag, .end-tag, .comment, .cdata, .doctype,
                                      .pi, .entity, .attribute-name, .attribute-value) {
          color: red;
          font-weight: bold;
        }

        #header {
          background-color: #ccc;
          background-color: #cab;
          border-bottom: 3px solid black;
          border-bottom: 3px solid orange;
          padding: 0.5em;
          margin-bottom: 1em;
        }

        #tree,
        .expandable-children {
          margin-inline-start: 1em;
        }

        .expandable-body {
          display: inline-block;
        }

        .expandable-body[open] {
          display: block;
        }

        .expandable-opening {
          list-style: '+' outside;
        }

        [open] > .expandable-opening {
          list-style-type: '−';
        }

        .expandable-opening::marker {
          cursor: pointer;
          padding-inline-end: 2px;
          /* Don't want to inherit the styling from pi and comment elements */
          color: initial;
          font: initial;
        }

        .comment {
          font-family: monospace;
          white-space: pre;
        }
      </style>
      <div id="header" dir="&locale.dir;">
        <p>
          &xml.nostylesheet;
        </p>
      </div>
      <main id="tree" class="highlight">
        <xsl:apply-templates/>
      </main>
    </div>
  </xsl:template>

  <xsl:template match="*">
    <div>
      <xsl:text>&lt;</xsl:text>
      <span class="start-tag"><xsl:value-of select="name(.)"/></span>
      <xsl:apply-templates select="@*"/>
      <xsl:text>/&gt;</xsl:text>
    </div>
  </xsl:template>

  <xsl:template match="*[node()]">
    <div>
      <xsl:text>&lt;</xsl:text>
      <span class="start-tag"><xsl:value-of select="name(.)"/></span>
      <xsl:apply-templates select="@*"/>
      <xsl:text>&gt;</xsl:text>

      <span class="text"><xsl:value-of select="."/></span>

      <xsl:text>&lt;/</xsl:text>
      <span class="end-tag"><xsl:value-of select="name(.)"/></span>
      <xsl:text>&gt;</xsl:text>
    </div>
  </xsl:template>

  <xsl:template match="*[* or processing-instruction() or comment() or string-length(.) &gt; 50]">
    <div>
      <details open="" class="expandable-body">
        <summary class="expandable-opening">
          <xsl:text>&lt;</xsl:text>
          <span class="start-tag"><xsl:value-of select="name(.)"/></span>
          <xsl:apply-templates select="@*"/>
          <xsl:text>&gt;</xsl:text>
        </summary>

        <div class="expandable-children"><xsl:apply-templates/></div>

      </details>
      <span class="expandable-closing">
        <xsl:text>&lt;/</xsl:text>
        <span class="end-tag"><xsl:value-of select="name(.)"/></span>
        <xsl:text>&gt;</xsl:text>
      </span>
    </div>
  </xsl:template>

  <xsl:template match="@*">
    <xsl:text> </xsl:text>
    <span class="attribute-name"><xsl:value-of select="name(.)"/></span>
    <xsl:text>=</xsl:text>
    <span class="attribute-value">"<xsl:value-of select="."/>"</span>
  </xsl:template>

  <xsl:template match="text()">
    <xsl:if test="normalize-space(.)">
      <xsl:value-of select="."/>
    </xsl:if>
  </xsl:template>

  <xsl:template match="processing-instruction()">
    <div class="pi">
      <xsl:text>&lt;?</xsl:text>
      <xsl:value-of select="name(.)"/>
      <xsl:text> </xsl:text>
      <xsl:value-of select="."/>
      <xsl:text>?&gt;</xsl:text>
    </div>
  </xsl:template>

  <xsl:template match="processing-instruction()[string-length(.) &gt; 50]">
    <div class="pi">
      <details open="" class="expandable-body">
        <summary class="expandable-opening">
          <xsl:text>&lt;?</xsl:text>
          <xsl:value-of select="name(.)"/>
        </summary>
        <div class="expandable-children"><xsl:value-of select="."/></div>
      </details>
      <span class="expandable-closing">
        <xsl:text>?&gt;</xsl:text>
      </span>
    </div>
  </xsl:template>

  <xsl:template match="comment()">
    <div class="comment">
      <xsl:text>&lt;!--</xsl:text>
      <xsl:value-of select="."/>
      <xsl:text>--&gt;</xsl:text>
    </div>
  </xsl:template>

  <xsl:template match="comment()[string-length(.) &gt; 50]">
    <div class="comment">
      <details open="" class="expandable-body">
        <summary class="expandable-opening">
          <xsl:text>&lt;!--</xsl:text>
        </summary>
        <div class="expandable-children">
          <xsl:value-of select="."/>
        </div>
      </details>
      <span class="expandable-closing">
        <xsl:text>--&gt;</xsl:text>
      </span>
    </div>
  </xsl:template>

</xsl:stylesheet>
