<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns="http://www.w3.org/1999/xhtml" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:output
	method="html"
	version="1.0"
	encoding="utf-8"
	indent="no"
	cdata-section-elements="script"
/>

<xsl:template match="/">
<html lang="en-US">
	<head>
		<meta charset="UTF-8"/>
		<xsl:comment>
			<xsl:value-of select="concat(system-property('xsl:version'), '/', system-property('xsl:vendor'), '/', system-property('xsl:vendor-url'))"/>
		</xsl:comment>
		
		<style type="text/css">
			<![CDATA[ @CSS@ ]]>
		</style>
	</head>
	<body>
		<div class="xv-search-panel">
			<input type="search" class="xv-search-field" spellcheck="false" placeholder="Search by name or XPath" />
			<span class="xv-search-xpath-result"></span>
		</div>
		<div class="xv-source-pane">
			<div class="xv-source-pane-inner"></div>
		</div>
		
		<div id="xv-source-data"><xsl:apply-templates/></div>
		
		<script type="text/javascript">
			<![CDATA[
			@JS@
			;xv_controller.process(document.getElementById('xv-source-data').textContent);
			]]>
		</script>
	</body>
</html>
</xsl:template>


<xsl:template match="comment()">
	&lt;!-- <xsl:value-of select="." /> -->
</xsl:template>

<xsl:template match="processing-instruction()">
	&lt;?<xsl:value-of select="name()"/><xsl:if test="string-length(.) > 0"><xsl:text> </xsl:text><xsl:value-of select="."/></xsl:if>?>
</xsl:template>

<xsl:template match="text()">
	<xsl:apply-templates select="." mode="attr-process"/>
</xsl:template>


<!-- elements with mixed content -->
<xsl:template match="*[*|comment()|processing-instruction()]">
	&lt;<xsl:value-of select="name()"/><xsl:call-template name='namespaces'/><xsl:apply-templates select="@*"/>>
	<xsl:apply-templates/>
	&lt;/<xsl:value-of select="name()"/>>
</xsl:template>


<!-- elements without mixed content -->
<xsl:template match="*">
	<xsl:variable name="lname" select="concat('name_', local-name())" />
	&lt;<xsl:value-of select="name()"/><xsl:call-template name='namespaces'/><xsl:apply-templates select="@*"/>><xsl:apply-templates/>&lt;/<xsl:value-of select="name()"/>>
</xsl:template>

<xsl:template match="@*">
	<xsl:text> </xsl:text><xsl:value-of select="name()"/>=<xsl:apply-templates select="." mode="attrvalue"/>
</xsl:template>

<!-- Try to emit well-formed markup for all single/double quote combinations in attribute values -->
<xsl:template match="@*[not(contains(., '&quot;'))]" mode='attrvalue'>"<xsl:apply-templates select="." mode="attr-process"/>"</xsl:template>
<xsl:template match='@*[not(contains(., "&apos;"))]' mode='attrvalue'>'<xsl:apply-templates select="." mode="attr-process"/>'</xsl:template>
<xsl:template match='@*[contains(., "&apos;") and contains(., &apos;"&apos;)]' mode='attrvalue'>"<xsl:variable name="attr">
  	<xsl:apply-templates select="." mode="attr-process"/>
  </xsl:variable><xsl:call-template name="replaceCharsInString">
  <xsl:with-param name="stringIn" select="$attr"/>
  <xsl:with-param name="charsIn" select="'&quot;'"/>
  <xsl:with-param name="charsOut" select="'&amp;quot;'"/>
</xsl:call-template>"</xsl:template>

<!-- Default attribute processing: escape &, < and > -->
<xsl:template match="@*|text()" mode="attr-process"><xsl:variable name="p1"><xsl:call-template name="replaceCharsInString">
			<xsl:with-param name="stringIn" select="string(.)" />
			<xsl:with-param name="charsIn" select="'&amp;'" />
			<xsl:with-param name="charsOut" select="'&amp;amp;'" />
	</xsl:call-template></xsl:variable>
	<xsl:variable name="p2"><xsl:call-template name="replaceCharsInString">
			<xsl:with-param name="stringIn" select="$p1" />
			<xsl:with-param name="charsIn" select="'&lt;'" />
			<xsl:with-param name="charsOut" select="'&amp;lt;'" />
	</xsl:call-template></xsl:variable>
	<xsl:call-template name="replaceCharsInString">
			<xsl:with-param name="stringIn" select="$p2" />
			<xsl:with-param name="charsIn" select="'&gt;'" />
			<xsl:with-param name="charsOut" select="'&amp;gt;'" />
	</xsl:call-template></xsl:template>


<!-- Emit namespace declarations -->
<xsl:template name="namespaces">
	<xsl:for-each select="@*|.">
		<xsl:variable name="my_ns" select="namespace-uri()"/>
		<!-- Emit a namespace declaration if this element or attribute has a namespace and no ancestor already defines it.
		     Currently this produces redundant declarations for namespaces used only on attributes. -->
		<xsl:if test="$my_ns and not(ancestor::*[namespace-uri() = $my_ns])">
			<xsl:variable name="prefix" select="substring-before(name(), local-name())"/>
			xmlns<xsl:if test="$prefix">:<xsl:value-of select="substring-before($prefix, ':')"/></xsl:if>='<xsl:value-of select="namespace-uri()"/>'
		</xsl:if>
	</xsl:for-each>
</xsl:template>


<!-- string search/replace used in the attribute quote templates above. From http://www.dpawson.co.uk/xsl/sect2/replace.html -->
<xsl:template name="replaceCharsInString">
	<xsl:param name="stringIn" />
	<xsl:param name="charsIn" />
	<xsl:param name="charsOut" />
	<xsl:choose>
		<xsl:when test="contains($stringIn,$charsIn)">
			<xsl:value-of select="concat(substring-before($stringIn,$charsIn),$charsOut)" />
			<xsl:call-template name="replaceCharsInString">
				<xsl:with-param name="stringIn" select="substring-after($stringIn,$charsIn)" />
				<xsl:with-param name="charsIn" select="$charsIn" />
				<xsl:with-param name="charsOut" select="$charsOut" />
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$stringIn" />
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>


</xsl:stylesheet>