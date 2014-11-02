'use strict';
(function($, window) {
    var hive = {};
    var managedForms = {};
    var pluginMap = {};
    var HIVE_MANAGED_KEY = 'hived';
    /**
     * Obtains all of the meta data for a given field
     * @param  Object element [description]
     * @param  Object form    [description]
     */
    var inspectPageFormFields = function(element, form) {
        var meta = $(element).data() || {};
        var key = (element.id !== '') ? element.id : element.name;
        if ((!meta.hasOwnProperty(HIVE_MANAGED_KEY)) || (meta[HIVE_MANAGED_KEY] === false)) {
            return;
        }
        form.fields[key] = {};
        form.fields[key].hub = new EventAggregator();
        form.fields[key].meta = meta;
        form.fields[key].el = element;
        form.fields[key].parent = form;
        form.fields[key].id = key;
        form.fields[key].name = element.name;
        form.fields[key].plugins = processPluginList(meta.plugins); //data.plugins.split(',');;
    };
    /**
     * Locates and builds a map of all the forms in the page using jquery
     */
    var inspectPageForms = function() {
        var meta;
        $('form').each(function() {
            meta = $(this).data() || {};
            //Locate any data elements defined for the form
            managedForms[this.id] = {};
            managedForms[this.id].method = $(this).attr('method');
            managedForms[this.id].action = $(this).attr('action');
            managedForms[this.id].meta = meta;
            managedForms[this.id].fields = {};
            managedForms[this.id].hub = new EventAggregator();
            managedForms[this.id].el = this;
            managedForms[this.id].plugins = processPluginList(meta.plugins);
            var that = this;
            //Locate all elements within the  form element
            $(this).children().each(function() {
                inspectPageFormFields(this, managedForms[that.id]);
            });
        });
    };
    var getPlugin = function(pluginName) {
        if (!pluginMap.hasOwnProperty(pluginName)) {
            return null;
        }
        return pluginMap[pluginName];
    };
    /**
     * Returns the configuration elements for a given component(A field or form element)
     * The configuration should be specified as data-pluginName.
     * @param  String pluginName [description]
     * @param  Object component  [description]
     * @return Object            A configuration JSON object
     */
    var getPluginConfigs = function(pluginName, component) {
        var meta = component.meta||{};
        return meta;
    }
    var processPluginList = function(list) {
        var plugins = {};
        var pluginKey;
        var pluginNames;
        //Ensure a plugin list has been provided
        if (typeof list !== 'string') {
            return plugins;
        }
        pluginNames = list.split(',');
        pluginKey;
        for (var index in pluginNames) {
            pluginKey = pluginNames[index];
            //A default implementation so that null checks do not need
            //to be performed
            plugins[pluginKey] = {
                load: function() {},
                unload: function() {}
            };
        }
        return plugins;
    };
    var loadComponentPlugins = function(component) {
        //Obtain the plugins
        var plugins = component.plugins;
        var pluginName;
        var PluginClass;
        var configs = {}
        for (var pluginKey in plugins) {
            //pluginName = plugins[pluginIndex];
            PluginClass = getPlugin(pluginKey);
            if (PluginClass) {
                //Obtain any configurations for the plugin
                configs = getPluginConfigs(pluginKey, component);
                component.plugins[pluginKey] = new PluginClass(configs);
                component.plugins[pluginKey].load(component);
            }
        }
    };
    /**
     * Responsible for aggregating events
     */
    function EventAggregator() {
        this.events = {};
    }
    /**
     * Subscribes a callback to a particular event
     * @param  String eventName A string event identified
     * @param  Function eventCb   A function callback that will be invoked when an event is fired
     */
    EventAggregator.prototype.sub = function(eventName, eventCb) {
        eventCb = (typeof eventCb === 'function') ? eventCb : function() {};
        if (!this.events.hasOwnProperty(eventName)) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(eventCb);
    };
    EventAggregator.prototype.pub = function(eventName, data) {
        //Locate the event
        var eventObj = this.events[eventName];
        if (!eventObj) {
            return;
        }
        for (var index in eventObj) {
            eventObj[index](data);
        }
    };
    hive.init = function(formList) {
        if (!$) {
            throw 'Dependency: jQuery was not found.Aborting initialization';
        }
        inspectPageForms(formList);
    };
    /**
     * Loads the plugins used by the form as well as those used by the fields.Each field
     * is provided with an event aggregator instance to handle communication
     * between plugins applied to each field
     * @param  Object|Array formList The form or forms that should be started
     */
    hive.start = function(formList) {
        var formList = (typeof formList === 'string') ? [formList] : formList;
        var form;
        var formKey;
        var field;
        var fields;
        var PluginClass;
        var pluginKey;
        for (var index in formList) {
            formKey = formList[index];
            form = managedForms[formKey];
            //Create a form to distribute form wide events
            form.hub = new EventAggregator();
            //Load all of the form plugins
            fields = form.fields ? form.fields : {};
            loadComponentPlugins(form);
            for (var fieldKey in fields) {
                field = fields[fieldKey];
                //Create an event aggregator for the field events
                field.hub = new EventAggregator();
                field.parent = form;
                loadComponentPlugins(field);
            }
        }
    };
    hive.plugin = function(pluginName, pluginImpl) {
        pluginMap[pluginName] = pluginImpl;
    };
    hive.events = {
        eventPluginLoaded: 'event.plugin.loaded',
        eventFieldValidationSuccess:'field.validation.success',
        eventFieldValidationFailure:'field.validation.fail',
        eventFieldContentEmpty:'field.content.empty',
        eventFieldContentChanged:'field.content.changed',
        eventFormSubmitted:'form.submit',
        eventFormSubmitSuccess:'form.submit.success',
        eventFormSubmitFailure:'form.submit.failure',
        eventFormValidationFailure:'form.validation.failure'
    };
    window.hive = hive;
}(jQuery, window));