(function($, window) {
    var hive = {};
    var managedForms = {};
    /**
     * Locates and builds a map of all the forms in the page using jquery
     */
    var inspectPageForms = function() {
        $('form').each(function() {
            //Locate any data elements defined for the form
            managedForms[this.id] = {};
            managedForms[this.id].method = $(this).attr('method');
            managedForms[this.id].action = $(this).attr('action');
            managedForms[this.id].meta = $(this).data();
            managedForms[this.id].fields = {};
            //Locate all elements within the form
        });
    };
    /**
     * Locate a form by its id
     * @param  {[type]} formId [description]
     * @return {[type]}        [description]
     */
    var getForm = function(formId) {
        if (managedForms.hasOwnProperty(formId)) {
            return managedForms[formId];
        }
        return null;
    };

    function EventAggregator() {
        this.events = {};
    }
    EventAggregator.prototype.sub = function(eventName, eventCb) {
        if (!this.events.hasOwnProperty(eventName)) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(eventCb);
    };
    EventAggregator.prototype.pub = function(eventName, data) {
    	//Locate the event
    	var eventObj = this.events[eventName];
    	if(!eventObj){
    		return;
    	}
    	for(var index in eventObj){
    		eventObj[index](data);
    	}
    };
    hive.init = function(formList) {
        if (!$) {
            throw "Dependency: jQuery was not found.Aborting initialization";
        }
        inspectPageForms();
    };
    hive.start = function() {};
    hive.stop = function() {};
    hive.plugin = function(pluginName, pluginImpl) {};
    window.hive = hive;
}(jQuery, window));