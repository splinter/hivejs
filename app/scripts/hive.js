/**
The MIT License (MIT)

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
'use strict';
(function($, window) {
    var hive = {};
    var managedForms = {};
    var pluginMap = {};
    var HIVE_MANAGED_KEY = 'hived';
    var addField = function(element, form, plugins, meta) {
        var pluginList = plugins || '';
        var metaData = meta || {};
        var key = element.id ? element.id : element.name;
        form.fields[key] = {};
        form.fields[key].hub = new EventAggregator();
        form.fields[key].meta = metaData;
        form.fields[key].el = element;
        form.fields[key].parent = form;
        form.fields[key].id = key;
        form.fields[key].name = element.name;
        form.fields[key].plugins = processPluginList(pluginList);
        form.fields[key].isSubmitReady = true;
    };
    /**
     * Recursively travels through all elements inside a form
     * and processes any elements that are marked for management 
     * @param  Object element The root element to begin the inspection
     * @param  Object form    The form in which the element is found
     */
    var recursiveInspectFields = function(element, form) {
        if ($(element).children().length == 0) {
            inspectPageFormFields(element, form)
            return;
        } else {
            $(element).children().each(function() {
                inspectPageFormFields(this, form);
            });
        }
    };
    /**
     * Obtains all of the meta data for a given field
     * @param  Object element An HTML element
     * @param  Object form    The meta information of the form in which the field is located
     */
    var inspectPageFormFields = function(element, form) {
        var meta = $(element).data() || {};
        var key = (element.id !== '') ? element.id : element.name;
        if ((!meta.hasOwnProperty(HIVE_MANAGED_KEY)) || (meta[HIVE_MANAGED_KEY] === false)) {
            return;
        }
        //TODO: Replace this code block with the addField method
        form.fields[key] = {};
        form.fields[key].hub = new EventAggregator();
        form.fields[key].meta = meta;
        form.fields[key].el = element;
        form.fields[key].parent = form;
        form.fields[key].id = key;
        form.fields[key].name = element.name;
        form.fields[key].plugins = processPluginList(meta.plugins); //data.plugins.split(',');;
        form.fields[key].isSubmitReady = true;
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
                //inspectPageFormFields(this, managedForms[that.id]);
                recursiveInspectFields(this, managedForms[that.id]);
            });
            //recursiveInspectFields(this,managedForms[that.id]);
        });
    };
    /**
     * Returns the plugin implementation given the name of the plugin
     * @param  String pluginName The name of the plugin
     * @return Function            The plugin implementation
     */
    var getPlugin = function(pluginName) {
        if (!pluginMap.hasOwnProperty(pluginName)) {
            return null;
        }
        return pluginMap[pluginName];
    };
    /**
     * Returns the configuration elements for a given component(A field or form element)
     * The configuration should be specified as data-pluginName.
     * @param  Object component  The component for which the plugin instance is instatiated
     * @return Object            A configuration JSON object
     */
    var getPluginConfigs = function(component) {
        var meta = component.meta || {};
        return meta;
    };
    /**
     * Provides a way to add new hived components to a form
     * @param {[type]} element [description]
     * @param {[type]} plugins [description]
     * @param {[type]} meta    [description]
     */
    var addNewComponent = function(element, plugins, meta) {
        var parent = this.component.parent;
        addField(element, parent, plugins, meta);
    };
    /**
     * Builds a map of the plugins by plugin name given a comma seperated
     * list of plugins
     * @param  String list The list of plugins to be instaniated
     * @return object 	A JSON object indicating the plugins specified by the list
     */
    var processPluginList = function(list) {
        var plugins = {};
        var pluginKey;
        var pluginNames;
        var defaultPluginImpl = {
            load: function() {},
            unload: function() {}
        };
        //Ensure a plugin list has been provided
        if (typeof list !== 'string') {
            return plugins;
        }
        pluginNames = list.split(',');
        for (var index in pluginNames) {
            pluginKey = pluginNames[index];
            //A default implementation so that null checks do not need
            //to be performed
            plugins[pluginKey] = defaultPluginImpl;
        }
        return plugins;
    };
    /**
     * Creates concrete instances of the plugins of a component.The plugins
     * property of the component is inspected and used to locate the plugins to be
     * instantiated
     * @param  Object component A form component
     */
    var loadComponentPlugins = function(component) {
        //Obtain the plugins
        var plugins = component.plugins;
        var PluginClass;
        var configs = {};
        for (var pluginKey in plugins) {
            //pluginName = plugins[pluginIndex];
            PluginClass = getPlugin(pluginKey);
            if (PluginClass) {
                //Obtain any configurations for the plugin
                configs = getPluginConfigs(pluginKey, component);
                component.plugins[pluginKey] = new PluginClass(configs);
                component.plugins[pluginKey].component = component;
                component.plugins[pluginKey].addNewComponent = addNewComponent;
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
        formList = (typeof formList === 'string') ? [formList] : formList;
        var form;
        var formKey;
        var field;
        var fields;
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
        eventFieldValidationSuccess: 'field.validation.success',
        eventFieldValidationFailure: 'field.validation.fail',
        eventFieldContentEmpty: 'field.content.empty',
        eventFieldContentChanged: 'field.content.changed',
        eventFormSubmitted: 'form.submit',
        eventFormSubmitSuccess: 'form.submit.success',
        eventFormSubmitFailure: 'form.submit.failure',
        eventFormValidationFailure: 'form.validation.failure',
        eventFieldSubmitReadyFalse: 'field.submit.notready'
    };
    window.hive = hive;
}(jQuery, window));