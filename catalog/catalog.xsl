<?xml version='1.0' encoding='UTF-8'?>

<!--
  Copyright 2020 Onfido Limited

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

  Transforms source into an HTML catalog.

  The catalog is generated from source props like this:

  <prop name='catalog'
    publisher='Acme'
    class='user'
    label='A useful integration'
    href='http://acme.com/useful/integration.html'>
    Short description can be included in prop content.
  </prop>
-->
<xsl:stylesheet
  version='1.0'
  xmlns:xsl='http://www.w3.org/1999/XSL/Transform'
  xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
  xmlns:xi='http://www.w3.org/2001/XInclude'
  exclude-result-prefixes='xsi xi'>

  <xsl:output method='html' encoding='UTF-8'/>

  <!--
    The value of the ?pod= query parameter on linked integrations.
  -->
  <xsl:param name='pod'/>

  <!--
    The optional class used to filter catalog entries to be displayed.
  -->
  <xsl:param name='class' select='"all"'/>

  <xsl:key name='publisher'
    match='//prop[@name="catalog"]'
    use='@publisher'/>

  <xsl:key name='classes'
    match='//prop[@name="catalog"]/@class'
    use='.'/>

  <xsl:template match='/'>

    <catalog class='{$class}'>

      <!-- Selectable classes -->
      <classes>
        <class name='all'>all</class>
        <xsl:for-each
          select='//prop[@name="catalog"]/@class[generate-id()=generate-id(key("classes",.)[1])]'>
          <xsl:sort select='.'/>
          <class name='{.}'>
            <xsl:value-of select='.'/>
          </class>
        </xsl:for-each>
      </classes>

      <!--
        Muenchian grouping by @publisher
      -->
      <publishers>
        <xsl:for-each
          select='//prop[@name="catalog"][count(. | key("publisher",@publisher)[1]) = 1]'>
          <xsl:sort select='@publisher'/>

          <!--
            Only include publishers with catalog entries matching the class.
          -->
          <xsl:if test='$class="all" or key("publisher",@publisher)[@class=$class]'>
            <publisher>

              <!--
                If any catalog entry specifies a domain=, hook out the first such value.
              -->
              <xsl:for-each select='key("publisher",@publisher)[@domain][1]'>
                <xsl:attribute name='domain'>
                  <xsl:value-of select='@domain'/>
                </xsl:attribute>
              </xsl:for-each>

              <header>
                <xsl:value-of select='@publisher'/>
              </header>

              <content>
                <xsl:apply-templates select='key("publisher",@publisher)'/>
              </content>
            </publisher>
          </xsl:if>

        </xsl:for-each>
      </publishers>

    </catalog>
  </xsl:template>

  <xsl:template match='prop[@name="catalog"]'>
    <!--
      Only include entries matching the class.
    -->
    <xsl:if test='$class="all" or @class=$class'>
      <entry class='{@class}'>
        <xsl:attribute name='href'>
          <xsl:choose>
            <xsl:when test='starts-with(@base,"user://owner@localhost")'>
              <xsl:value-of select='substring-after(@base,"user://owner@localhost")'/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select='@base'/>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:text>?pod=</xsl:text>
          <xsl:value-of select='$pod'/>
        </xsl:attribute>
        <label>
          <xsl:value-of select='@label'/>
        </label>
        <description>
          <xsl:value-of select='text()'/>
        </description>
      </entry>
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>