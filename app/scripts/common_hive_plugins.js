'use strict';
(function(hive) {
    /**
     * Checks if all fields can be submitted
     */
    function AjaxController() {}
    AjaxController.prototype.load = function(component) {
        var fields = component.fields || {};
        var field;
        $(component.el).submit(function(ev) {
            ev.preventDefault();
            alert('Form submit event called!');
            for (var fieldKey in fields) {
                field = fields[fieldKey];
                if (!field.isSubmitReady) {
                    field.hub.pub(hive.events.eventFieldSubmitReadyFalse);
                    component.hub.pub(hive.events.eventFieldSubmitReadyFalse, field);
                }
            }
        });
    };

    function MandatoryFieldValidator() {}
    MandatoryFieldValidator.prototype.load = function(component) {
        var value = $(component.el).val();
        if (value === '') {
            component.isSubmitReady = false;
        }
        $(component.el).change(function() {
            console.log('Value: ' + $(this).val());
        });
    };

    function FormStatusBar() {}
    FormStatusBar.prototype.load = function(component) {
        component.hub.sub(hive.events.eventFieldSubmitReadyFalse, function() {
            $(component.el).append('<div class="alert alert-success">One or more mandatory fields have not been filled in!</div>');
        });
    };
    hive.plugin('ajaxController', AjaxController);
    hive.plugin('mandatoryFieldValidator', MandatoryFieldValidator);
    hive.plugin('formStatusBar', FormStatusBar);
}(hive));