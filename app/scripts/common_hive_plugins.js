(function(hive) {
    function TestListener(configs) {
    	console.log('testListener initialized with '+JSON.stringify(configs));
    }
    TestListener.prototype.load = function(comp) {
        comp.hub.sub('textEntered', function(data) {
            console.log('Text entered ' + data.id);
        });
    };
    TestListener.prototype.unload = function(comp) {};

    function TestEmitter() {}
    TestEmitter.prototype.load = function(comp) {
        $(comp.el).on('click', function() {
            //comp.hub.pub('textEntered', comp);
        });
    };
    TestEmitter.prototype.unload = function(comp) {};

    function MandatoryFieldValidator() {}
    MandatoryFieldValidator.prototype.load = function(comp) {
    	$(comp.el).change(function(){
    		alert('Text changed');
    	})
    };
    MandatoryFieldValidator.prototype.unload = function(comp) {};
 	function FieldNotifications(){

 	}
 	FieldNotifications.prototype.load = function(comp){
 		comp.hub.sub('validation.failed',function(){
 			alert('The value entered for the field is invalid');
 		});
 		comp.hub.sub('validation.success',function(){
 			alert('Yay!');
 		});
 	};
    hive.plugin('testListener', TestListener);
    hive.plugin('testEmitter', TestEmitter);
    hive.plugin('mandatoryFieldValidation',MandatoryFieldValidator);
    hive.plugin('fieldNotifications',FieldNotifications);
}(hive));