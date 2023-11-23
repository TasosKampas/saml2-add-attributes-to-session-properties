/*
 * The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 * You can obtain a copy of the License at legal/LICENSE.md. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/LICENSE.md. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets {{}} replaced by your own identifying
 * information: "Portions copyright {{year}} {{name_of_copyright_owner}}".
 *
 * Copyright 2022 ForgeRock AS.
 */

/*
 * Sets all saml2 attributes to session properties
 */

/**
 * Node config
 */
var nodeConfig = {
    Saml2_nameid_info: "sun-fm-saml2-nameid-info",
    Saml2_nameid_infokey: "sun-fm-saml2-nameid-infokey",
    userinfoSharedStateProperty: "userInfo",
    attributesSharedStateProperty: "attributes",
    nodeName: "SAML2attributesToSession"
};

/**
 * Node outcomes
 */

var nodeOutcomes = {
    TRUE: "true",
    ERROR: "error"
};

/**
 * Node imports
 */

var javaImports = JavaImporter(
    org.forgerock.openam.auth.node.api.Action
);

/**
 * Node logger
 */

var nodeLogger = {
    debug: function(message) {
        logger.message("***" + nodeConfig.nodeName + " " + message);
    },
    warning: function(message) {
        logger.warning("***" + nodeConfig.nodeName + " " + message);
    },
    error: function(message) {
        logger.error("***" + nodeConfig.nodeName + " " + message);
    }
};

/**
 * The attributes object also includes the nodeConfig.Saml2_nameid_info and nodeConfig.Saml2_nameid_infokey keys.
 * This method just removes those 2 keys so only the SAML2 attributes remain
 * returns a JSON Object that includes only the SAML2 attributes, or an error if not found
 */

function prepareSaml2Attributes() {
    var attributes = sharedState.get(nodeConfig.userinfoSharedStateProperty).get(nodeConfig.attributesSharedStateProperty);
    if (attributes) {
        attributes.remove(nodeConfig.Saml2_nameid_info);
        attributes.remove(nodeConfig.Saml2_nameid_infokey);
        return attributes;
    } else {
      	nodeLogger.error("Couldn't find the attributes in the shared state. Outcome is ERROR.");
        return javaImports.Action.goTo(nodeOutcomes.ERROR).build();
    }
}

/**
 * Sets the session properties
 */

function setSessionProperties(actionBuilder, saml2attributes, attributeKeys) {
    for (var count = 0; count < attributeKeys.length; count++) {
        var attrToRetrieve = saml2attributes[attributeKeys[count]].get(0);
        var attrMappingKey = attributeKeys[count];
        nodeLogger.error("Found attribute key " + attrMappingKey + " with value " + attrToRetrieve);
        actionBuilder = actionBuilder.putSessionProperty(attrMappingKey, attrToRetrieve);
    }
    nodeLogger.error("Session properties set");
    return actionBuilder;
}

/**
 * Main
 */

function getAction() {
    var saml2AttributesSet = prepareSaml2Attributes();
    var keys = Object.keys(saml2AttributesSet);
    if (keys.length > 0) {
        nodeLogger.error("Attributes found in the Assertion.");
        return setSessionProperties(javaImports.Action.goTo(nodeOutcomes.TRUE), saml2AttributesSet, keys).build();
    } else {
        nodeLogger.error("No attributes in the Assertion.");
        return javaImports.Action.goTo(nodeOutcomes.TRUE).build();
    }
}


(function() {
    nodeLogger.error("node executing");
    action = getAction();
})();