(function(window)
{
    Gitana.Methods = {};

    /**
     * Produces the common function to handle listAttachments() on various attachables within Gitana.
     *
     * @param [mapClass] map implementation class (if none provided, uses Gitana.BinaryAttachmentMap)
     *
     * @return {Function}
     */
    Gitana.Methods.listAttachments = function(mapClass) {

        if (!mapClass) {
            mapClass = Gitana.BinaryAttachmentMap;
        }

        return function(local) {

            var self = this;

            var result = this.subchain(new mapClass(this));
            if (!local)
            {
                // front-load some work that fetches from remote server
                result.then(function() {

                    var chain = this;

                    self.getDriver().gitanaGet(self.getUri() + "/attachments", null, function(response) {
                        chain.handleResponse(response);
                        chain.next();
                    });

                    return false;
                });
            }
            else
            {
                result.then(function() {

                    var chain = this;

                    // try to populate the map from our cached values on the node (if they exist)
                    var existingMap = self.getSystemMetadata()["attachments"];
                    if (!existingMap) {
                        throw new Error("Local system attachments not found");
                    }

                    // attachments that come off of system() don't have "attachmentId" on their json object
                    // instead, the "attachmentId" is the key into the map.

                    // so here, in terms of normalizing things, we copy "attachmentId" into the json object
                    for (var key in existingMap)
                    {
                        var value = existingMap[key];
                        value["attachmentId"] = key;
                    }

                    chain.handleResponse(existingMap);
                });
            }

            return result;
        };
    };

    /**
     * Produces the common function to handle attach() of attachments to an attachable within Gitana.
     *
     * @param [attachmentClass] attachment implementation class (if none provided, uses Gitana.BinaryAttachment)
     * @param [paramsFunction] optional population function for url params
     *
     * @return {Function}
     */
    Gitana.Methods.attach = function(attachmentClass, paramsFunction) {

        if (!attachmentClass) {
            attachmentClass = Gitana.BinaryAttachment;
        }

        return function(attachmentId, contentType, data)
        {
            var self = this;

            if (!attachmentId)
            {
                attachmentId = "default";
            }

            // the thing we're handing back
            var result = this.subchain(new attachmentClass(this));

            // preload some work onto a subchain
            result.then(function() {

                // params
                var params = {};
                if (paramsFunction) {
                    paramsFunction(params);
                }

                // upload the attachment
                var uploadUri = self.getUri() + "/attachments/" + attachmentId;
                this.chainUpload(this, uploadUri, params, contentType, data).then(function() {

                    // read back attachment information and plug onto result
                    this.subchain(self).listAttachments().then(function() {

                        // TODO: update attachment information on attachable.system() ?

                        this.select(attachmentId).then(function() {
                            result.handleResponse(this);
                        });
                    });
                });
            });

            return result;
        };
    };

    /**
     * Produces the common function to handle unattach() of attachments from an attachable within Gitana.
     *
     * @return {Function}
     */
    Gitana.Methods.unattach = function()
    {
        return function(attachmentId) {

            return this.then(function() {
                this.chainDelete(this, this.getUri() + "/attachments/" + attachmentId).then(function() {
                    // TODO
                });
            });
        };
    };

})(window);