/*
selectYearMinthday plugin 
-----------------------------------
by Michael for Brastel, 2011/08
-----------------------------------
This plugin is used to select a date by using  3 comboboxes : year, month and day.
You just have to associate the plugin with an empty DOM element.
The plugin updates an input field (type text or hidden).
By default, plugin looks for the first input inside the DOM element but you can specify it by using options
If the input field is filled with a date value, the 3 comboboxes will be updated from this value.
(useful when editing an existing document)
------------------------------------------
Examples of code :

$("#box1").selectYearMonthDay();

$("#box2").selectYearMonthDay({						  
	input:$("#birthDate2"),
	nbYear:20,
	minimumAge:3
	}						   	
);


If you want to select a date by default, you can also use the second parameter, that is a Javascript Date object

$("#test2").selectYearMonthDay({
	input:$("#birthDate2")
	},
	new Date()							   
);

*/
(function($){

var DEBUG=true;	
		
// private function for debugging
  function debug(txt) {
    if (DEBUG && window.console && window.console.log)
      window.console.log(txt);
  };
  
	
function initSelectYear(comboBox,minAge,n,defaultText,selectedValue){
	var option=null;
	var today=new Date();
	var currentYear=today.getFullYear()-minAge;
	if(defaultText) comboBox.options[0]=new Option(defaultText,"0");
	for(var i=currentYear;i>currentYear - n;i--){
		option=new Option(""+i,""+i);
		if(i==selectedValue) option.selected=true;
		comboBox.options[comboBox.options.length]=option;
	}
}

var initSelectMonth=function(comboBox,months,defaultText){
	var option=null;
	if(defaultText) comboBox.options[0]=new Option(defaultText,"0");
	for(var i=0;i<12;i++){
		option=new Option(months[i],""+(i+1));
		comboBox.options[comboBox.options.length]=option;
	}
}


var updateComboDay=function(comboBox,year,month,day,defaultText){
	//Update the content of the days list combobox (from 1 to 28, 29, 30, 31 according to the current month)
	var nb=getNbJourMois(year,month);
	debug(comboBox.tagName+"#"+comboBox.id+" from 1 to "+nb);
	var option=null;
	comboBox.options.length=0;
	var index=day-1
	if(day==0 || day>nb){
		if(defaultText) comboBox.options[0]=new Option(defaultText ,"0");
		index=0;
	}

	for(var i=1;i<=nb;i++){
		option=new Option(i,i);
		comboBox.options[comboBox.options.length]=option;
	}
	comboBox.selectedIndex=index;
	return comboBox.options[index].value;

}

var formatDate=function(year,month,day){
	var dd=(day<10) ? "0"+day : ""+day;
	var MM=(month<10) ? "0"+month : ""+month; 
	return year + "-" + MM + "-" +dd;
}

var getNbJourMois=function(year,month){
//Renvoie le nombre du jour du mois donné : 28, 29, 30 ou 31
  var d=new Date(year,month-1,1);
	d.setMonth(d.getMonth()+1);
	d.setDate(d.getDate()-1);
  return(d.getDate());
}

var updateDay=function(div,year,month,day,dayNames){
//Update the given div with the day of the week of the date
	var d=new Date(year,month-1,day);
	debug(div.tagName+"#"+div.id+" year="+year+" month="+month+" day="+day+" "+d.toString());
	div.innerHTML=dayNames[d.getDay()];//d.toString();	
}

	  
	  
 $.fn.selectYearMonthDay = function(options,dateObject) {  
  
	var defaults = {  
		nbYear:100,
		minimumAge:18,
		months:"Jan;Feb;Mar;Apr;May;June;July;Aug;Sep;Oct;Nov;Dec",
		selectMonth:null,
		days:"Sunday;Monday;Tuesday;Wednesday;Thursday;Friday;Saturday",
		input:this.find("input"),//input (type text or hidden to be updated with selected date)
		separator:"&nbsp;",
		defaultDay:"--",
		defaultMonth:"--",
		defaultYear:"----",
		className:"",
	};  
  var options = $.extend(defaults, options);  
      
  return this.each(function() {
  	  
  		obj = $(this);
		var defaultValue=options.input.val();
		if(defaultValue!="") dateObject=new Date(defaultValue);
  		
  		var year=(dateObject) ? dateObject.getFullYear() : 0;
  		var month=(dateObject) ? dateObject.getMonth()+1 : 0;
  		var day=(dateObject) ? dateObject.getDate() : 0;
  		var id=this.id;
  		var prefixe="select-year-month-day-"+id+"-";
  		
  		var selectYear=document.createElement("select");		
		selectYear.className="years ignore-validation";
		$(selectYear).addClass(options.className).css("width","auto");
  		initSelectYear(
					   selectYear,
					   options.minimumAge,
					   options.nbYear,
					   (dateObject) ? null : options.defaultYear,
					   (dateObject) ? year : null
		);
		
  		obj.append(selectYear);
		if(options.separator) obj.append(options.separator);
  		
  		var selectMonth=document.createElement("select");
		selectMonth.className="months ignore-validation";
		$(selectMonth).addClass(options.className).css("width","auto");
		
		var months=[];
		if(options.selectMonth && options.selectMonth.length==1){
			var x=options.selectMonth.get()[0].options;
			jQuery.each(x,function(index,element){
				months.push(element.text);
			});
		}
		else{
			months=options.months.split(";")
		}
  		initSelectMonth(selectMonth,months,(dateObject) ? null : options.defaultMonth);
		if(dateObject) selectMonth.selectedIndex=month-1;
  		obj.append(selectMonth);
		if(options.separator) obj.append(options.separator);
  		if(!dateObject) $(selectMonth).hide();
  		
  		var selectDay=document.createElement("select");
  		selectDay.id=prefixe+"days";
		selectDay.className="days ignore-validation";
  		obj.append(selectDay);
		$(selectDay).addClass(options.className).css("width","auto");
		if(options.separator) obj.append(options.separator);
  		if(dateObject){
			updateComboDay(selectDay,year,month, day,null);
			selectDay.selectedIndex=day-1;
			options.input.val(formatDate(dateObject.getFullYear(),dateObject.getMonth()+1,dateObject.getDate()));
		}
		else{
			$(selectDay).hide();
			options.input.val("");
		}
		  		
  		$(selectYear).change(function() {
			var x=$.makeArray(this.options);  			
  			year=parseInt(this.options[this.selectedIndex].value);
  			$(selectMonth).show();
  			if(month>0) updateComboDay(selectDay,year,month,day);
  			if(month>0 && day>0){
  				//A day has already been selected
  				 updateDay(div,year,month,day,options.days.split(";"));
				 updateData(year,month,day);
  			}
  			//Remove the first option (the default ---- )
  			if(this.options[0].value=="0") this.remove(0);	 
  		}
  		);//onchange
  		
  		$(selectMonth).change(function() {
  			month=parseInt(this.options[this.selectedIndex].value);
  			day=updateComboDay(selectDay,year,month,day,options.defaultDay);
  			$(selectDay).show();
  			/*if(day>0){
				updateDay(div,year,month,day,options.days.split(";"));
				updateData(year,month,day);
			}*/
  			//Remove the first option (the default ---- )
  			if(this.options[0].value=="0") this.remove(0);	 
			updateData(year,month,day);
  		}
  		);//onchange
  		
		$(selectDay).change(function() {
  			day=parseInt(this.options[this.selectedIndex].value);
  			//old $(div).show();
  			//old updateDay(div,year,month,day,options.days.split(";"));
  			//Remove the first option (the default ---- )
  			if(this.options[0].value=="0") this.remove(0);	 
			updateData(year,month,day);
  		}
  		);//onchange
		
		var updateData=function(year,month,day){
		//When day, month or date has been changed, update hidden field	
			var strDate="";
			if(!(year==0 || month==0 || day==0)){
				strDate=formatDate(year,month,day)
			}
			if(options.input.val()==strDate) return false;
			options.input.val(strDate);
			if(options.callback) options.callback();
			
		}
  		
 	});//each
  
 

 };//$.fn.  
})(jQuery); 