(function(window)
{
    var Gitana = window.Gitana;
    
    Gitana.SystemMetadata = Gitana.AbstractObject.extend(
    /** @lends Gitana.SystemMetadata.prototype */
    {
        /**
         * @constructs
         * @augments Gitana.AbstractObject
         *
         * @class System Metadata
         *
         * @param {Object} object the system metadata json object
         */
        constructor: function(object)
        {
            this.base(object);
        },

        /**
         * Retrieves the changeset id.
         *
         * @public
         *
         * @return the changeset id
         */
        getChangesetId: function()
        {
            return this["changeset"];
        },

        /**
         * Retrieves the id of the user who created this object.
         *
         * @public
         *
         * @return the user id of the creator
         */
        getCreatedBy: function()
        {
            return this["created_by"];
        },

        /**
         * Retrieves the id of the user who modified this object.
         *
         * @public
         *
         * @return the user id of the modifier
         */
        getModifiedBy: function()
        {
            return this["modified_by"];
        },

        /**
         * Retrieves the timestamp for creation of this object.
         *
         * @public
         *
         * @return creation timestamp
         */
        getCreatedOn: function()
        {
            if (!this.createdOn)
            {
                this.createdOn = new Gitana.Timestamp(this["created_on"]);
            }

            return this.createdOn;
        },

        /**
         * Retrieves the timestamp for modification of this object.
         *
         * @public
         *
         * @return modification timestamp
         */
        getModifiedOn: function()
        {
            if (!this.modifiedOn)
            {
                this.modifiedOn = new Gitana.Timestamp(this["modified_on"]);
            }

            return this.modifiedOn;
        }
        
    });
    
})(window);
