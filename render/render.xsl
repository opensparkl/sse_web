<?xml version='1.0' encoding='UTF-8'?>

<!--
  Copyright 2018 SPARKL Limited

  Licensed under the Apache License, Version 2.0 (the 'License');
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an 'AS IS' BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Author: jacoby@sparkl.com

  Transforms a SPARKL XML document into HTML.
-->
<xsl:stylesheet
  version='1.0'
  xmlns:xsl='http://www.w3.org/1999/XSL/Transform'
  xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
  xmlns:xi='http://www.w3.org/2001/XInclude'
  exclude-result-prefixes='xsi xi'>

  <xsl:output method='html' encoding='UTF-8'/>

  <!--
    Folder.
  -->
  <xsl:template match='folder'>
    <xsl:copy>
      <xsl:copy-of select='@*'/>
      <xsl:call-template name='pathname'/>
      <xsl:call-template name='open-close-header'/>
      <xsl:call-template name='folder-content'/>
    </xsl:copy>
  </xsl:template>

  <!--
    Mix.
  -->
  <xsl:template match='mix'>
    <xsl:copy>
      <xsl:copy-of select='@*'/>
      <xsl:call-template name='pathname'/>
      <xsl:call-template name='open-close-header'/>
      <xsl:call-template name='folder-content'/>
    </xsl:copy>
  </xsl:template>

  <!--
    Folder contents.
  -->
  <xsl:template name='folder-content'>
    <content>
      <xsl:call-template name='props'/>

      <xsl:if test='service'>
        <services>
          <xsl:apply-templates select='service'/>
        </services>
      </xsl:if>

      <xsl:if test='field'>
        <fields>
          <xsl:apply-templates select='field'/>
        </fields>
      </xsl:if>

      <xsl:if test='notify|solicit|request|consume'>
        <operations>
          <xsl:apply-templates
            select='notify|solicit|request|consume'/>
        </operations>
      </xsl:if>

      <xsl:if test='folder|mix'>
        <folders>
          <xsl:apply-templates select='folder|mix'/>
        </folders>
      </xsl:if>
    </content>
  </xsl:template>

  <!--
    Service.
  -->
  <xsl:template match='service'>
    <xsl:copy>
      <xsl:copy-of select='@*'/>
      <xsl:call-template name='pathname'/>
      <xsl:call-template name='open-close-header'/>
      <content>
        <xsl:call-template name='attr-table'/>
        <xsl:call-template name='props'/>
      </content>
    </xsl:copy>
  </xsl:template>

  <!--
    Field.
  -->
  <xsl:template match='field'>
    <xsl:copy>
      <xsl:copy-of select='@*'/>
      <xsl:call-template name='pathname'/>
      <xsl:call-template name='open-close-header'/>
      <content>
        <xsl:call-template name='attr-table'/>
        <xsl:call-template name='props'/>
      </content>
    </xsl:copy>
  </xsl:template>

  <!--
    Prop.
  -->
  <xsl:template match='prop'>
    <xsl:copy>
      <xsl:copy-of select='@*'/>
      <xsl:call-template name='open-close-header'>
        <xsl:with-param name='show-icon-if'
          select='@*[not(local-name()="name")]|text()'/>
      </xsl:call-template>
      <content>
        <xsl:call-template name='attr-table'/>
        <xsl:apply-templates/>
      </content>
    </xsl:copy>
  </xsl:template>

  <!--
    Prop text content.
  -->
  <xsl:template match='prop/text()'>
    <pre>
      <xsl:value-of select='.'/>
    </pre>
  </xsl:template>

  <!--
    Notify.
  -->
  <xsl:template match='notify'>
    <table class='operation'>
      <tr class='notify'>
        <td class='set'>
          <notify>
            <xsl:call-template name='set'/>
          </notify>
        </td>
        <td class='fields'>
          <xsl:apply-templates select='@fields'/>
        </td>
      </tr>
    </table>
  </xsl:template>

  <!--
    Solicit/Response.
  -->
  <xsl:template match='solicit'>
    <table class='operation'>
      <tr class='solicit'>
        <td class='set'>
          <solicit>
            <xsl:call-template name='set'/>
          </solicit>
        </td>
        <td class='fields'>
          <xsl:apply-templates select='@fields'/>
        </td>
      </tr>
      <xsl:for-each select='response'>
        <tr class='response'>
          <td class='set'>
            <response>
              <xsl:call-template name='set'/>
            </response>
          </td>
          <td class='fields'>
            <xsl:apply-templates select='@fields'/>
          </td>
        </tr>
      </xsl:for-each>
    </table>
  </xsl:template>

  <!--
    Request/Reply.
  -->
  <xsl:template match='request'>
    <table class='operation'>
      <tr class='request'>
        <td class='set'>
          <request>
            <xsl:call-template name='set'/>
          </request>
        </td>
        <td class='fields'>
          <xsl:apply-templates select='@fields'/>
        </td>
      </tr>
      <xsl:for-each select='reply'>
        <tr class='reply'>
          <td class='set'>
            <reply>
              <xsl:call-template name='set'/>
            </reply>
          </td>
          <td class='fields'>
            <xsl:apply-templates select='@fields'/>
          </td>
        </tr>
      </xsl:for-each>
    </table>
  </xsl:template>

  <!--
    Consume[/Reply].
  -->
  <xsl:template match='consume'>
    <table class='operation'>
      <tr class='consume'>
        <td class='set'>
          <consume>
            <xsl:call-template name='set'/>
          </consume>
        </td>
        <td class='fields'>
          <xsl:apply-templates select='@fields'/>
        </td>
      </tr>
      <xsl:for-each select='reply'>
        <tr class='reply'>
          <td class='set'>
            <reply>
              <xsl:call-template name='set'/>
            </reply>
          </td>
          <td class='fields'>
            <xsl:apply-templates select='@fields'/>
          </td>
        </tr>
      </xsl:for-each>
    </table>
  </xsl:template>

  <!--
    Output fields.
  -->
  <xsl:template
    match='notify/@fields|solicit/@fields|reply/@fields'>
    <xsl:call-template name='fields'>
      <xsl:with-param name='string' select='.'/>
    </xsl:call-template>
  </xsl:template>

  <!--
    Input fields.
  -->
  <xsl:template
    match='response/@fields|request/@fields|consume/@fields'>
    <xsl:call-template name='fields'>
      <xsl:with-param name='string' select='.'/>
    </xsl:call-template>
  </xsl:template>

  <!--
    Attributes are copied.
  -->
  <xsl:template match='@*'>
    <xsl:copy-of select='.'/>
  </xsl:template>

  <!--
    Everything else is ignored.
  -->
  <xsl:template match='node()|@*'/>

  <!--
    The input or output set of an operation, excluding fields.
  -->
  <xsl:template name='set'>
    <xsl:copy-of select='@*'/>
    <xsl:call-template name='pathname'/>
    <xsl:call-template name='open-close-header'>
      <xsl:with-param name='show-icon-if'
        select='@*[not(local-name()="name")][not(local-name()="fields")]|*'/>
    </xsl:call-template>
    <content>
      <xsl:call-template name='attr-table'>
        <xsl:with-param name='omit' select='"name fields"'/>
      </xsl:call-template>
      <xsl:call-template name='props'/>
    </content>
  </xsl:template>

  <!--
    Open-close action header with state "opened" or "closed".
    This must come *before* any content except attributes.
  -->
  <xsl:template name='open-close-header'>
    <xsl:param name='show-icon-if' select='@*[not(local-name()="name")]|*'/>
    <xsl:param name='state' select='"closed"'/>
    <xsl:attribute name='class'>
      <xsl:value-of select='$state'/>
    </xsl:attribute>
    <xsl:attribute name='action'>open-close</xsl:attribute>
    <header>
      <xsl:if test='$show-icon-if'>
        <span class='icon open-close'/>
      </xsl:if>
      <span class='name' title='Click to toggle listener'>
        <xsl:value-of select='@name'/>
      </span>

      <xsl:if test='@base'>

        <xsl:variable name='browser-href'>
          <xsl:call-template name='browser-href'>
            <xsl:with-param name='uri' select='@base'/>
          </xsl:call-template>
        </xsl:variable>

        <xsl:choose>
          <xsl:when test='$browser-href!=""'>
            <a class='href' title='{@base}' href='{$browser-href}'>
              <xsl:call-template name='basename'>
                <xsl:with-param name='uri' select='@base'/>
              </xsl:call-template>
            </a>
          </xsl:when>

          <xsl:otherwise>
            <span class='href' title='Cannot link from browser'>
              <xsl:call-template name='basename'>
                <xsl:with-param name='uri' select='@base'/>
              </xsl:call-template>
            </span>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:if>

      <!-- Grants appear in header. -->
      <xsl:if test='grant'>
        <grants>
          <xsl:apply-templates select='grant'/>
        </grants>
      </xsl:if>

    </header>
  </xsl:template>

  <!--
    Grant.
  -->
  <xsl:template match='grant'>
    <xsl:copy>
      <to>
        <xsl:value-of select='@to'/>
      </to>

      <permission>
        <read>
          <xsl:choose>
            <xsl:when test='contains(@permission,"r")'>
              <xsl:attribute name='class'>true</xsl:attribute>
              <xsl:text>r</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>-</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </read>

        <write>
         <xsl:choose>
            <xsl:when test='contains(@permission,"w")'>
              <xsl:attribute name='class'>true</xsl:attribute>
              <xsl:text>w</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>-</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </write>

        <execute>
         <xsl:choose>
            <xsl:when test='contains(@permission,"x")'>
              <xsl:attribute name='class'>true</xsl:attribute>
              <xsl:text>x</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>-</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </execute>
      </permission>

    </xsl:copy>
  </xsl:template>

  <!--
    Attributes table.
    By default, omits the "name=" attribute.
    Supply the "omit" param to change.
  -->
  <xsl:template name='attr-table'>
    <xsl:param name='omit' select='"name"'/>
    <xsl:variable name='spaced-omit'
      select='concat(" ",$omit," ")'/>
    <table class='attributes'>
      <xsl:apply-templates select='@*' mode='attr-table'/>
    </table>
  </xsl:template>

  <!--
    The name= and href= attributes are handled separately in all cases.
  -->
  <xsl:template match='@name' mode='attr-table'/>
  <xsl:template match='@base' mode='attr-table'/>

  <!--
    The fields= attribute on operations is handled separately.
  -->
  <xsl:template match='notify/@fields' mode='attr-table'/>
  <xsl:template match='solicit/@fields' mode='attr-table'/>
  <xsl:template match='response/@fields' mode='attr-table'/>
  <xsl:template match='request/@fields' mode='attr-table'/>
  <xsl:template match='reply/@fields' mode='attr-table'/>
  <xsl:template match='consume/@fields' mode='attr-table'/>

  <!--
    All other attributes are output.
  -->
  <xsl:template match='@*' mode='attr-table'>
    <tr>
      <td class='attr-name'>
        <xsl:value-of select='local-name()'/>
      </td>
      <td class='attr-value'>
        <xsl:value-of select='.'/>
      </td>
    </tr>
  </xsl:template>

  <!--
    Props, if present.
  -->
  <xsl:template name='props'>
    <xsl:if test='prop'>
      <props>
        <xsl:apply-templates select='prop'/>
      </props>
    </xsl:if>
  </xsl:template>

  <!--
    Fields, input or output, space separated.
  -->
  <xsl:template name='fields'>
    <xsl:param name='string'/>
    <xsl:choose>
      <xsl:when test='contains($string," ")'>
        <xsl:call-template name='field'>
          <xsl:with-param
            name='string'
            select='substring-before($string," ")'/>
        </xsl:call-template>
        <xsl:call-template name='fields'>
          <xsl:with-param
            name='string'
            select='substring-after($string," ")'/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name='field'>
          <xsl:with-param
            name='string'
            select='$string'/>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!--
    Field, input or output.
  -->
  <xsl:template name='field'>
    <xsl:param name='string'/>
    <div class='field' name='{$string}'>
      <span class='icon'/>
      <span class='label'>
        <xsl:value-of select='$string'/>
      </span>
    </div>
  </xsl:template>

  <!--
    Generates an attribute containing the pathname of the element.
  -->
  <xsl:template name='pathname'>
    <xsl:attribute name='pathname'>
      <xsl:apply-templates select='.' mode='pathname'/>
    </xsl:attribute>
  </xsl:template>

  <!--
    Returns pathname of any element.
  -->
  <xsl:template match='folder|mix' mode='pathname'>
    <xsl:apply-templates select='parent::*' mode='pathname'/>
    <xsl:value-of select='@name'/>
    <xsl:text>/</xsl:text>
  </xsl:template>

  <xsl:template match='*' mode='pathname'>
    <xsl:apply-templates select='parent::*' mode='pathname'/>
    <xsl:value-of select='@name'/>
  </xsl:template>

  <!--
    Converts a file:docroot uri into a browser-clickable href.
    Otherwise returns the uri intact.
  -->
  <xsl:template name='browser-href'>
    <xsl:param name='uri'/>

    <xsl:choose>
      <xsl:when test='starts-with($uri,"file://docroot.node/")'>
        <xsl:value-of select='substring-after($uri, "file://docroot.node")'/>
      </xsl:when>
      <xsl:when test='starts-with($uri,"http://") or starts-with($uri,"https://")'>
        <xsl:value-of select='$uri'/>
      </xsl:when>
      <xsl:otherwise/>
    </xsl:choose>
  </xsl:template>

  <!--
    Returns the base name of a uri.
  -->
  <xsl:template name='basename'>
    <xsl:param name='uri'/>
    <xsl:choose>
      <xsl:when test='contains($uri,"/")'>
        <xsl:call-template name='basename'>
          <xsl:with-param name='uri'
            select='substring-after($uri,"/")'/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select='$uri'/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>
