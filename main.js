
/* internal variables */ 
internal_monitor = [] ; 



paper.install(window);
window.addEventListener("load" , onWindowLoad); 

array_to_monitor = "array"; 

var element_to_animate;
var element_to_animate_from ; 
var element_to_animate_to;  

var user_entered_variables = [];
var to_monitor = [] ; 

var compound_path_array; 

var editor ; 

var pause = false ; 

function onWindowLoad()
{
	let canvas =  document.getElementById("myCanvas") ; 
	context = canvas.getContext('2d'); 
	
	//context.font= "12px cFont";
	canvas.setAttribute("width" , "" +document.getElementById("visualizer").getBoundingClientRect().width ) ; 

	/* setup paper */ 
	paper.setup('myCanvas');

	canvas.style.border ="none" ; 
	unpause = false ; 
	generateAst(); 

	/* setup ace */
	editor = ace.edit("editor");
    	editor.setTheme("ace/theme/custom");
	editor.setOptions({showPrintMargin :false , highlightActiveLine  : false, behavioursEnabled: true }) ;
    	editor.session.setMode("ace/mode/javascript");
	setInterval(codeEditorChange, 1500); 

	/* resize the separator */ 
	let separator = document.getElementById("separator"); 
	let left = document.getElementById("editor");
	let right = document.getElementById("visualizer") 
	separator.style.width = right.getBoundingClientRect().x - (left.getBoundingClientRect().x + left.getBoundingClientRect().width) ; 	

	/* position the separator */ 
	//let style = window.getComputedStyle(left); 
	//separator.style.left =  left.getBoundingClientRect().x + left.getBoundingClientRect().width ; 

	/*?!??!?!?!?!?!?!!?!?!?!?!!?!? Uncomment ONE of the following 'program' variables */
	
	// #Uncomment the line below to see visualizations of the heterogeneus array growing , and being modified  
	// program = "var a = 1 ;array = []; array.push(100); while((a < 200) ) { if(a===2) array.push('String test'); if(a===3)array.push('A String') ; array.push(a) ;array[a] =array[a-1]; a++; }  " ; 		// #insertion sort --- Uncomment the line below to see visualizations of an insertion sort algorithm
	// /*insert*/program = "var array = [54, 26, 93, 17, 77, 31,  44, 55] ;var i = 0, j= 0 ; while( i  < array.length) { let value = array[i]; var j = i -1 ; while (j > -1 && array[j] > value){ array[j + 1] = array[j] ;   j-- ; }  array[j + 1]= value ; i++ ; }  "; 
	
	// /*shell sort*/program = "var array = [54, 26, 93, 17, 77, 31,  44, 55];  var increment = array.length / 2; while (increment > 0) { var i = increment; while(i < array.length) { var j = i; var temp = array[i]; while (j >= increment && array[j-increment] > temp) { array[j] = array[j-increment]; j = j - increment;} array[j] = temp; i++;} if (increment == 2) { increment = 1; } else { increment = parseInt(increment*5 / 11);}} console.log(array)";
	///*bubble*/ program = "var array = [54, 26, 93, 17, 77, 31,  44, 55]; var len = array.length; var i = 0;     while( i < len){var j=0;var stop = len - i; while (j < stop){  if (array[j] > array[j+1]){ var temp = array[j]; array[j] = array[j+1]; array[j+1] = temp;} j++;}i++;} console.log(array)";
	/*selection*/ program = "var array = [54, 26, 93, 17, 31, 44, 55]; var len = array.length; var i = 0; while (i < len){ var min = i; var j = i+1; while ( j < len){ if (array[j] < array[min]){ min = j; } j++; } if (i != min){ var temp = array[min]; array[min] = array[i]; array[i] = temp; } i++;}";

	// remove this 
	program = astring.generate(esprima.parse(program))
	editor.setValue(program); 
}


function codeEditorChange()
{
	p = editor.getSession().getValue() ;
	getGlobalVariablesFromCode(esprima.parse(p));
	generateCheckboxes(); 
}

function generateCheckboxes()
{
	
	let container = document.getElementById("selector"); 

	let to_compare = [];  
	let checkboxes = document.getElementsByClassName("vchk");
	let create_elements = true ; 
	if(checkboxes.length != 0 )
	{
		for(let i = 0 ; i < checkboxes.length ; i++) 
		{	
			to_compare.push(checkboxes[i].getAttribute("variable")) ; 
		}	

		let left_over = to_compare.filter(function (item , pos) 
			{
				if(user_entered_variables.indexOf(item) === -1)
					return true ; 
				else 
					return false ;  
			}) ; 

		
		if(left_over.length != 0 )
		{
			container.innerHTML = "" ; 
			create_elements = true ;  
		}
		else 
			create_elements = false ; 
	}

	if(create_elements)
	{
		user_entered_variables = user_entered_variables.filter(function(item , pos) 
			{ return user_entered_variables.indexOf(item) == pos;  });

		 
			for (i in user_entered_variables)
			{	
				let label = document.createElement("Label") ; 
				label.setAttribute("class" , "check-container"); 
				label.innerHTML = user_entered_variables[i] ; 
					let input = document.createElement("input");
					input.setAttribute("type" ,  "checkbox"  );
					input.setAttribute("class" , "vchk")
					input.setAttribute("variable" , user_entered_variables[i]); 
			
					let span = document.createElement("span"); 
					span.setAttribute("class" , "checkmark");

				label.appendChild(input) ; 
				label.appendChild(span); 
			
				container.appendChild(label); 
		
		
			}
	}
}


function runSimulaton()
{	
	getVariablesToMonitor() ; 
	
	//internal_monitor[0] = {indexes: []}; 
	
	program = editor.session.getValue(); 
	/* generate abstract syntax tree */ 
	ast = esprima.parse(program, {loc: true}); 
	/* add global variables that hold the snapshot of the array */ 
	ast.body = global_variables_ast.body.concat(ast.body)
	
	/* get a list of all variables that this tool can monitor, allow user to select one */ 
	getGlobalVariablesFromCode(ast);

	
	generateCheckboxes(); 

	
	//console.log(ast) ; 
	/* recursively walk the ast, modifying it where necessary. This is where the code is analysed and necessary code is added in  */ 
	r_walk(ast);

	/* generate a javascript program from the ast */ 
	var modified_program = astring.generate(ast) ; 

	
	console.log("Internally Generated Code:"); 
	console.log(modified_program); 
	
	/* run the simulation */ 
	eval(modified_program);

	
	/* show the simulation */ 
	showVisualization(); 
	
} 	

function getVariablesToMonitor()
{
	let checkboxes = document.getElementsByClassName("vchk"); 
	
	for(i in checkboxes)
	{
		if(checkboxes[i].checked)
		{
			to_monitor.push(checkboxes[i].getAttribute("variable"))
		}
	}
	
	console.log(to_monitor) ; 

}


function  getGlobalVariablesFromCode(node)
{
	

	if(node.type == "Program")
	{
		user_entered_variables  = [] ; 		
		getGlobalVariablesFromCode(node.body); 
		
	}
	else
	{
		for (i in node)
		{
			switch(node[i].type)
			{
				case "WhileStatement":
					getGlobalVariablesFromCode(node[i])
				break; 
				case "BlockStatement":
					getGlobalVariablesFromCode(node[i].body)
				break ; 
				case "VariableDeclaration": 
					for (j in node[i].declarations)
						user_entered_variables.push(node[i].declarations[j].id.name); 
				break ; 
				
			}// end switch 
		}// end for
	}// end else 
}


/* recursively walk the AST */ 
function r_walk(node, level = 0 )
{
	
	
	if(node.type == "Program")
	{
		r_walk(node.body); 
	}
	else
	{
		for (i in node)
		{
			switch(node[i].type)
			{
			case "VariableDeclaration" :
				
				let declaration = node[i] ; 
				for(d in declaration.declarations)
				{
					if(declaration.declarations[d].id.type === "Identifier")
					{
						if(to_monitor.indexOf(declaration.declarations[d].id.name) > -1  )
						{
					
							if(declaration.declarations[d].init === null)
							{
								console.log("Null primitive"); 
								internal_monitor.push({name : declaration.declarations[d].id.name , type : "PRIMITIVE" , action: null , snapshots : []}); 
							}
							else 
							{
								switch (declaration.declarations[d].init.type)
								{
									case "ArrayExpression": 
										internal_monitor.push({name : declaration.declarations[d].id.name , type : "ARRAY" , action: null , snapshots : []}); 
									break ; 
									case "Literal":
										internal_monitor.push({name : declaration.declarations[d].id.name , type : "PRIMITIVE" , action: null , snapshots : []}); 
									break ;
									case "Identifier":
										internal_monitor.push({name : declaration.declarations[d].id.name , type : "PRIMITIVE" , action: null , snapshots : []}); 
									break ;
									   
								
								}
							}
							 
							
						}
					}
					else
					{
						console.log("invalid declaration found: 1") ; 
					}
				}
			break ; 
				
			case "WhileStatement":
				/* change the test */ 
				let new_test = esprima.parse("(" + astring.generate(node[i].test)+ ") && (internal_continue_execution === true) ").body[0] ; // esprima.parse return aprogram			
				node[i].test = new_test.expression ; 
				
				/* add definitions to top of the loop */ 
				var definitions = "let snapshot = {};  let element; let array_element "; 
				var definitions_ast = esprima.parse(definitions) ; 
				node[i].body.body = definitions_ast.body.concat(node[i].body.body) ; 
				
				
				/* walk the statements found in the while block */ 
				for(let j = 0 ; j < node[i].body.body.length ; j++)
				{
					
					
					element = node[i].body.body[j]; 
					console.log(element); 
					var statement_operation = getStatementOperation(element) ; 
				
					console.log(statement_operation.type, to_monitor.indexOf(statement_operation.name), statement_operation.name)
				
					/* WHEN YOU CHANGE ONE , CHANGE ALL */ 
					
					if(to_monitor.indexOf(statement_operation.name) > -1 )
					{
						let action = "" ; 
						let snapshot_code  = "" ; 
						switch(statement_operation.type)
						{
							case "MOVE":
								action = "snapshot.action = {}; snapshot.action.code = '"+astring.generate(element)+"'; snapshot.action.type = 'move'; snapshot.action.defined = true ;  snapshot.action.operation = {from:"+statement_operation.assignment.right_property +" , to : " + statement_operation.assignment.left_property + "};" ;			
								action += "snapshot.snapshot = "+ statement_operation.name  +".slice(0);";  

								snapshot_code = "array_element = getInternalMonitorElement('" + statement_operation.name + "'); array_element.element.snapshots.push({snapshot: snapshot.snapshot, action : snapshot.action}); console.log(array_element);" ;
								snapshot_code += "for(var __internal_counter_i = 0 ; __internal_counter_i < internal_monitor.length ; __internal_counter_i++){ ";
								snapshot_code += "if(__internal_counter_i != array_element.index){internal_monitor[__internal_counter_i].snapshots.push({action: null, snapshot: '-$-'})}}"; 
								let move_ast = esprima.parse(action + snapshot_code);
								console.log(astring.generate(move_ast));  
									
								node[i].body.body =  node[i].body.body.slice(0 , j).concat(node[i].body.body[j]).concat(move_ast.body.concat(node[i].body.body.slice(j+1))); 
							break ; 
							case "VARIABLE_UPDATE_INCREMENT": 
								console.log("we heere")
								action = "snapshot.action = {} ;  snapshot.action.code = '"+ astring.generate(element)  + "' ;snapshot.action.type = 'primitive_increment' ; snapshot.action.defined = true ; snapshot.snapshot = "+ statement_operation.name +";" ;
								snapshot_code = "element = getInternalMonitorElement('" + statement_operation.name + "'); element.element.snapshots.push(snapshot);" ;
								snapshot_code += "for(var __internal_counter_i = 0 ; __internal_counter_i < internal_monitor.length ; __internal_counter_i++){ ";
								snapshot_code += "if(__internal_counter_i != element.index){internal_monitor[__internal_counter_i].snapshots.push({action: null, snapshot: '-$-'})}}"; 
								   
										
								ast_string = action + snapshot_code ; 
								_ast = esprima.parse(ast_string) ;
								console.log(astring.generate(_ast));
								
								node[i].body.body = node[i].body.body.slice(0 , j+1 ).concat(_ast.body.concat(node[i].body.body.slice(j+1)) ); 
																			
							break; 
							case "VARIABLE_UPDATE_DECREMENT": 
								console.log(statement_operation); 
							break ; 
						} 
					}
				}

				
				/* add the end_loop code */ 
				//if(level === 0 )
				//{
					if(node[i].body.type === "NOBlockStatement")
					{
						// add block level declaration of the move variable 
						let code = "let action = {};"; 
						let code_ast = esprima.parse(code).body; 
						node[i].body.body = code_ast.concat(node[i].body.body); 	

						node[i].body.body = node[i].body.body.concat(end_loop_ast.body)
						//console.log(node[i].body)
					}				
	
				//}
				
				/* recurse -- do it in this order for now to potentiall avoid loops */ 
				r_walk(node[i] , ++level); 
				
				
			break ; 
			case "BlockStatement":
				r_walk(node[i].body, ++level)
				break ; 
			default:
			break ; 
				
			}
		}
		
	} 
}

function getInternalMonitorElement(name)
{
	for (var  i = 0 ; i < internal_monitor.length ; i++)
	{
		if(internal_monitor[i].name === name )
		{
			return {element: internal_monitor[i] , index : i }; 
		}			
	}
}

/* called when unpause button is clicked */ 
function unPause()
{
	unpause = true ;
	console.log("clicked");  
}

/* Busy wait loop that pauses the code , the sleep is so that the loop doesnt hog the cpu */ 
async function pause()
{
	while(unpause === false)
	{
		await sleep(50); 
	}
	unpause = false ; 
}

function pausePlayRender()
{
	var button = document.getElementById("pause_play_button");
	var image = document.getElementById("pause_play_image") ; 
	
	if(button.getAttribute("current_icon") === "pause")
	{
		image.setAttribute("src" , "assets/play.png");
		button.setAttribute("current_icon" , "play");
		pause = true ; 
	}
	else
	{
		image.setAttribute("src" , "assets/pause.png");
		button.setAttribute("current_icon" , "pause");
		pause = false ;
	}
}

/* implement sleep */ 
function sleep(ms) 
{
  return new Promise(resolve => setTimeout(resolve, ms));
}



/**Todo : bracket support **/  
function buildBinaryExpression(expression)
{
	var left , right ; 
	
	/* Recursively get left */ 
	if(expression.left.type === "BinaryExpression")
	{
	
		left = buildBinaryExpression(expression.left) ; 
	}
	else if (expression.left.type === "Identifier" )
	{
		left = expression.left.name ; 
	}
	else if (expression.left.type === "Literal")
	{
		left = expression.left.raw; 

	}	
	
	
	/* Recursively get right */ 
	if(expression.right.type === "BinaryExpression")
	{
		
		right = buildBinaryExpression(expression.right) ; 
	}
	else if(expression.right.type === "Identifier" )
	{
		right = expression.right.name ; 
	}
	else if (expression.right.type === "Literal")
	{
		right = expression.right.raw  ; 

	}	
		
	/* print left + [operator] + right */ 
	let exp = left + expression.operator + right

	return exp ; 

	
}

/* pass in a member expression, get the fully qualified object name , neeed testing  */ 
function buildFullyQualifiedAttributeName( node )
{
	var q_name = "" ; 

	var property = "" ; 


	
	if(node.object.type === "MemberExpression")
	{
		q_name =  buildFullyQualifiedAttributeName( node.object )  ; 
		
	}
	else if(node.object.type === "Identifier")
	{
		q_name = node.object.name ; 
	}
	else if (node.object.type === "Literal")
	{
		q_name = node.object.raw ; 
	}
	
	
	if(node.property.type === "Identifier")
	{
		property = node.property.name;
		q_name += "." + property 
	}
	else if(node.property.type === "Literal")
	{
		property = node.property.raw ;
		if(isNumeric(property))
			q_name += '[' + property + ']' ;
		else
		    	q_name += '["' + property + '"]' ;
	}


	
	return q_name ; 
	
}

function isNumeric(test)
{
	return !isNaN(test); 
}

function getStatementOperation(node)
{
	
	/* this node is an expression */ 
	if(element.type === "ExpressionStatement")
	{
		if(element.expression.type === "AssignmentExpression") 
		{		
			//console.log(buildFullyQualifiedAttributeName( element.expression.left )) ;
			
			/* determine if the operation is an assignment to a variable */ 
			if(element.expression.left.type === "Identifier")
			{
				/* this is an assignment to a variable, not an object or an array, get the value being passed to it */ 
				if(element.expression.right.type === "Identifier")
				{
						if (element.expression.operation === "=")
							return {type : "VARIABLE_ASSIGNMENT" , left : element.expression.left.name , right : element.expression.right.name} ; 
						else 
							console.log("FOUND INVALID OPERATION : 1") ; 
				}
				else if(element.expression.right.type === "Literal" )
				{
						if (element.expression.operation === "=")
							return {type : "VARIABLE_ASSIGNMENT" , left : element.expression.left.name , right : element.expression.right.raw } ; 
						else 
							console.log("FOUND INVALID OPERATION : 2 ")  ;
				}

			}
			if(element.expression.left.type === "MemberExpression" && element.expression.right.type === "MemberExpression" && element.expression.left.object.name === array_to_monitor)
			{

				let assignment = getAssignmentParts(element.expression); 
				if(assignment.left_object_name === assignment.right_object_name) // MOVE
				{
					return {type : "MOVE" , name: assignment.left_object_name , assignment: assignment } ; 
				} 
			}
			else if (element.expression.left.type ===  "MemberExpression" && element.expression.right.type === "Identifier" && element.expression.left.object.name === array_to_monitor)
			{
				if(element.expression.left.property.type === "Identifier"  )
					return {type: "MOVE_IN" , assignment: {from: element.expression.right.name , to: element.expression.left.property.name }} ;
				else if(element.expression.left.property.type === "Literal")
					return {type: "MOVE_IN" , assignment: {from: element.expression.right.name , to: element.expression.left.property.raw }} ;
				else if(element.expression.left.property.type === "BinaryExpression")
					return {type: "MOVE_IN" , assignment: {from: element.expression.right.name , to: buildBinaryExpression(element.expression.left.property) }} ;
			}
			else if(element.expression.left.type === "Idendifier" )
			{

				/* if it constitutes a move from a variable into the array . n.b. still record the variable */ 
				if (element.expression.right.type === "MemberExpression" && element.expression.right.object.name === array_to_monitor )
				{
					 if(element.expression.right.property.type === "Identifier"  )
						return {type: "MOVE_OUT" , assignment: {from: element.expression.left.name , to: element.expression.right.property.name }} ;
					else if(element.expression.right.property.type === "Literal")
						return {type: "MOVE_OUT" , assignment: {from: element.expression.left.name , to: element.expression.right.property.raw }} ;
					else if(element.expression.right.property.type === "BinaryExpression")
						return {type: "MOVE_OUT" , assignment: {from: element.expression.left.name , to: buildBinaryExpression(element.expression.right.property) }} ;
				}
				else /* if it does not constitute a move out , it still is an assignment so get the new value */ 
				{
					
				} 
			}	

			 
		}
		else if (element.expression.type === "UpdateExpression") 
		{
			if(element.expression.argument.type === "Identifier" )
					{
						if(element.expression.operator === "++" )
						{
							return {type : "VARIABLE_UPDATE_INCREMENT" , name : element.expression.argument.name  }; 
						}
						else if(element.expression.operator === "--")
						{
							return {type : "VARIABLE_UPDATE_DECREMENT" , name : element.expression.argument.name  }; 
						}
						else 
						{
								console.log("Invalid update expression found : 2"); 
						}
					}
					else
					{
						console.log("Invalid update expression found: 1"); 
					}
		}
	}
	else if(element.type === "VariableDeclaration")
	{	

		
		/* check to see if any of the declarations is a move_out of the array  */ 
		for(d in element.declarations) 
		{
			console.log(element.declarations[d])
			if(element.declarations[d].id.type === "Identifier")
			{
				if(element.declarations[d].init)
				{
					if(element.declarations[d].init.type === "MemberExpression" && element.declarations[d].init.object.name == array_to_monitor )
					{	
						if(element.declarations[d].init.property.type === "BinaryExpression")
						{
							return {type: "MOVE_OUT" ,  assignment: {from : buildBinaryExpression(element.declarations[d].init.property) , to :  element.declarations[d].id.name  }}; 
						}
						else
						{
							return {type: "MOVE_OUT" ,  assignment: {from : element.declarations[d].init.property.name , to :  element.declarations[d].id.name  }}; 
						}
					}
					else if (element.declarations[d].init.type === "BinaryExpression")
					{	
						return {type: "IDENTIFIER_CHANGE" , identifier : element.declarations[d].id.name , change_to : buildBinaryExpression(element.declarations[d].init)}
					}
					else if (element.declarations[d].init.type === "Identifier")
					{
						return {type: "IDENTIFIER_CHANGE" , identifier : element.declarations[d].id.name , change_to : element.declarations[d].init.name}
					}
				}
	
			}
		} 
	}

	return {type: "OTHER"} ; 
					
} 

function determineOperationType(node) 
{
	
	if(node.left.type === "MemberExpression" && node.right.type === "MemberExpression" && node.left.object.name === array_to_monitor) 
	{
		
		let assignment = getAssignmentParts(node); 
		if(assignment.left_object_name === assignment.right_object_name)
		{
	
			return {type : "MOVE" , assignment: assignment } ; 
		}

	}
	else if (node.type === "VariableDeclaration")
	{
		/* check to see if any of the declarations is a move_out of the array  */ 
		for(d in node.declarations) 
		{
			console.log("reached here")
			if(node.declarations[d].init.type === "MemberExpression" && node.declarations[d].init.object.name == array_to_monitor && node.declarations[d].id.type === "Identifier")
				if(node.declarations[d].init.property.type === "BinaryExpression")
					console.log( {type: "MOVE_OUT" ,  assignment: {from : buildBinaryExpression(node.declarations[d].init.property) , to :  node.declarations[d].id.name  }}); 
		}
	}
	else if (node.left.type === "MemberExpression" && node.left.object.name === array_to_monitor )
	{
		return {type: "CHANGE" } ; 
	}
	else 
		return {type : "OTHER"} ; 			
}


function getAssignmentParts(node)
{

	/* get left object name */ 
	let left_object_name = ""; 
	left_object_name = node.left.object.name ; 
		
	/* get the left property type */ 
	let left_property_type = "" ; 
	let left_property = ""; 
	left_property_type = node.left.property.type ; 
		
	
	/* get the right object name */ 
	let right_object_name = "" ; 
	right_object_name = node.right.object.name ; 
		
	
	/* get the right property */ 
	let right_property = ""; 
	let right_property_type = "" ; 
	right_property_type = node.right.property.type ; 
	
	
	
	// if the type of property on the left is
	switch(left_property_type)
	{
		case "Identifier": // an identifier
			left_property = node.left.property.name ; 
			break ; 
 
		case "Literal" : 
			left_property = node.left.property.raw ; 	
			break ; 
		case "BinaryExpression": 
			left_property = buildBinaryExpression(node.left.property ) ;
			break ; 
	}
	

	/* get the right property */ 
	switch(right_property_type)
	{
		case "Identifier": 
			right_property = node.right.property.name ; 
			break ; 
		case "Literal" : 
			right_property = node.right.property.raw ; 
			break ; 
		case "BinaryExpression": 
			right_property = buildBinaryExpression(node.right.property) ; 
			break ; 
	}
	
	return {left_object_name : left_object_name , left_property : left_property , right_object_name : right_object_name , right_property: right_property }; 
}




async function showVisualization()
{

	
	
	var current_code = document.getElementById("current_code"); 
	
	var fontSize = 15; 
	var cellPadding = 8;  	
	var array ; 


	let variable_paths = [] ; 

	for (i in to_monitor)
	{
		if(getInternalMonitorElement(to_monitor[i]).element.type === "PRIMITIVE")
		{
			variable_paths[i] = new PointText(new Point(50 , (i *20) + 150) ); 
			variable_paths[i].content = ""+to_monitor[i] + " :"; 
			variable_paths[i].fontSize = 16; 
			variable_paths[i].fillColor = "white" ;
		}
	}	

	for(var k = 0 ; k < internal_monitor[0].snapshots.length ; k++)
	{

		for(j = 0 ; j < internal_monitor.length ; j++) 
		{
			if(internal_monitor[j].type === "PRIMITIVE")
			{
				let snapshot = 	internal_monitor[j].snapshots[k] ; 
				
				if(snapshot.snapshot != "-$-")
				{
					/* find the path corresponding to the variable */ 
					let index = to_monitor.indexOf(internal_monitor[j].name ) ; 
					variable_paths[index].content = ""+to_monitor[index]+ ": "+ snapshot.snapshot ; 
						current_code.innerHTML = snapshot.action.code ; 
					await sleep(800) ; 
				

				}

			}
			else if(internal_monitor[j].type === "ARRAY")
			{
				
				let snapshot = 	internal_monitor[j].snapshots[k] ; 
				if(snapshot.snapshot != "-$-")
				{

					var element = internal_array_monitor[j] ; 

					var children = 
					{
						children : [ ] , 
					}

					/* draw out one row of cells */ 
					let current_length = 0 ; 
					var cell_widths = [] ; 

			
					for(var i = 0 ; i < snapshot.snapshot.length ; i++)
					{
						var text ; 
						var cell_width = 30;
				
						/* if the cell is empty put a dash */
						if(typeof snapshot.snapshot[i] === "undefined" || snapshot.snapshot[i]=== null)
						{
							text = new PointText(new Point(i*22 + 11 , 0 ) ); 
							text.content ="-" ; 
			
						}	
						else
						{
							string = snapshot.snapshot[i].toString() ; // get the contents of the cell 
							if(string.length > 1)
								cell_width = context.measureText(string).width + 3*cellPadding 	;  // measure it 				
			
							/* position it */ 		
							let x = current_length + cellPadding ; 
							let y =40 -  fontSize  ; 
			
							/* set the text */ 
							text = new PointText(new Point(x ,y ))
							text.content = string ; 
			
						}
	
				
				
						text.fillColor = "white" ;
						text.fontSize = fontSize ;
						//text.fontFamily = "cFont"; 
						children.children.push(text) ; 

						cell_widths.push(cell_width); 
						if(i === snapshot.snapshot.length-1 )
						{
							children.children.push(makeCell(cell_width).translate(new Point(current_length  ,0) ))
						}
						else 
							children.children.push(makeCell(cell_width , true).translate(new Point(current_length  ,0) ))

						current_length += cell_width + 2  ; 
					 
					}

					console.log(snapshot ); 
					/* if something is done to this particular array ellemt */ 
					if( snapshot.action.defined )
					{

						/* Display the code , that is being represented ... to the user  */ 
						current_code.innerHTML = snapshot.action.code + "<br> Element moved within the array"; 


						let to = snapshot.action.operation.to ; // the index of the cell to move to 
						let from = snapshot.action.operation.from; // the origin cell index 
						let element_to_move = children.children.filter(obj => obj.constructor.name === "PointText" )[from]; 
						let reference_element  = children.children.filter(obj => obj.constructor.name === "PointText") [to]; 
	
						element_to_animate = element_to_move ;
	
						/* calculate from_x */ 
						var from_x  = 0 ; 
						var sum_width = 0 ; 
						var i ; 
						for(i = 0 ; i < from ; i++)
						{
							sum_width += cell_widths[i]+2; 
						}
						sum_width += cell_widths[from] / 2  ;
						from_x = sum_width ;   

						/* calculate to_x */ 
						var to_x  = 0 ; 
						sum_width = 0 ; 
						for(i = 0 ; i < to ; i++)
						{
							sum_width += cell_widths[i]+2; 
						}
						sum_width += cell_widths[to] / 2  ;
						to_x = sum_width ;   
						to_x = reference_element.position.x ;
			
						/* translate the elemtnt*/ 
						element_to_animate.animate({
						  properties: {
						    position: {
						      x: to_x, // relative to the current position of the item. At the end, `x` will be : 275 
						      y: "+0"     // absolute position. At the end, `y` will be : 150 
						    },
						 
						  },
						  settings: {
						    duration:300,
						    easing:"easeOut"
						  }
						});
			

						/* fade the element */ 
						reference_element.animate({
						  properties: {
						    opacity: 0, 
						 
						  },
						  settings: {
						    duration:300,
						    easing:"easeIn"
						  }
						});
					}
					else current_code.innerHTML = "" ; 
		

					if(compound_path_array)
						compound_path_array.remove(); 

					compound_path_array = new CompoundPath( children);
	
				//	array.strokeColor = "#b82d88" ; 
					compound_path_array.strokeColor = "#ffffff" ;		
					compound_path_array.strokeWidth = 1.5 ;
					compound_path_array.miterLimit= 1 ; 

					compound_path_array.translate(new Point(50 , 200  ))

					 			
					await sleep(800);
				}
			
			
			}// end else if 
		} 
		

		while(pause )
			await sleep(50); 
	}
	
view.draw(); 	
	for (var j  = 0 ; j < internal_array_monitor.length ; j++ )
	{
		
		var element = internal_array_monitor[j] ; 

		var children = 
		{
			children : [ ] , 
		}

		/* draw out one row of cells */ 
		let current_length = 0 ; 
		var cell_widths = [] ; 
		for (var i = 0 ; i < element.snapshot.length ; i++) 
		{
			var text ; 
			var cell_width = 30 ; 	
			
			/* if the cell is empty put a dash */
			if(typeof element.snapshot[i] === "undefined" || element.snapshot[i]=== null)
			{
				text = new PointText(new Point(i*22 + 11 , 0 ) ); 
				text.content ="-" ; 
				
			}	
			else
			{
				string = element.snapshot[i].toString() ; // get the contents of the cell 
				if(string.length > 1)
					cell_width = context.measureText(string).width + 3*cellPadding 	;  // measure it 				
				
				/* position it */ 		
				let x = current_length + cellPadding ; 
				let y =40 -  fontSize  ; 
				
				/* set the text */ 
				text = new PointText(new Point(x ,y ))
				text.content = string ; 
				
			}


			text.fillColor = "black" ;
			text.fontSize = fontSize ;
			text.fontFamily = "cFont"; 
			children.children.push(text) ; 

			cell_widths.push(cell_width); 
			if(i === element.snapshot.length-1 )
			{
				children.children.push(makeCell(cell_width).translate(new Point(current_length  ,0) ))
			}
			else 
				children.children.push(makeCell(cell_width , true).translate(new Point(current_length  ,0) ))

			current_length += cell_width + 2  ; 
		}

		/* draw all variables*/
		/* for nnow , just get all the variables in the program */ 
	

		console.log(element ); 
		/* if something is done to this particular array ellemt */ 
		if( element.action.defined )
		{

			/* Display the code , that is being represented ... to the user  */ 
			current_code.innerHTML = element.action.code + "<br> A move within the array"; 


			let to = element.action.operation.to ; // the index of the cell to move to 
			let from = element.action.operation.from; // the origin cell index 
			let element_to_move = children.children.filter(obj => obj.constructor.name === "PointText" )[from]; 
			let reference_element  = children.children.filter(obj => obj.constructor.name === "PointText") [to]; 
	
			element_to_animate = element_to_move ;
	
			/* calculate from_x */ 
			var from_x  = 0 ; 
			var sum_width = 0 ; 
			var i ; 
			for(i = 0 ; i < from ; i++)
			{
				sum_width += cell_widths[i]+2; 
			}
			sum_width += cell_widths[from] / 2  ;
			from_x = sum_width ;   

			/* calculate to_x */ 
			var to_x  = 0 ; 
			sum_width = 0 ; 
			for(i = 0 ; i < to ; i++)
			{
				sum_width += cell_widths[i]+2; 
			}
			sum_width += cell_widths[to] / 2  ;
			to_x = sum_width ;   
			to_x = reference_element.position.x ;
			
			/* translate the elemtnt*/ 
			element_to_animate.animate({
			  properties: {
			    position: {
			      x: to_x, // relative to the current position of the item. At the end, `x` will be : 275 
			      y: "+0"     // absolute position. At the end, `y` will be : 150 
			    },
			 
			  },
			  settings: {
			    duration:300,
			    easing:"easeOut"
			  }
			});
			

			/* fade the element */ 
			reference_element.animate({
			  properties: {
			    opacity: 0, 
			 
			  },
			  settings: {
			    duration:300,
			    easing:"easeIn"
			  }
			});
		}
		else current_code.innerHTML = "" ; 
		
		
		if(array)
			array.remove(); 


		array = new CompoundPath( children);
			
	//	array.strokeColor = "#b82d88" ; 
		array.strokeColor = "#ffffff" ;		
		array.strokeWidth = 1.5 ;
		array.miterLimit= 1 ; 

		array.translate(new Point(50 , 200  ))

		 		
		await sleep(800);
			
	}
	
	
		

}

function frame()
{
	console.log(element_to_animate)
	if(element_to_animate)
	element_to_animate.translate(new Point(2, 0)) ; 
}


function makeCell(width=20 ,  closed=false )
{                                                        
	var cell = new Path(); 
	cell.add(new Point(0.5, 0.5 ));
	cell.add(new Point(0.5 , 40.5)); 
	cell.add(new Point(width+0.5 , 40+0.5));	

	/* the last box in an array representation */ 
	var end_cell = cell.clone(); 
	end_cell.add(new Point(width+0.5, 0.5)); 

	return (closed) ? cell : end_cell ; 
	
}


function generateAst()
{
	var end_loop_code = "let to_be_added = {snapshot: array.slice(0), action : action}	; \n\
if(to_be_added.snapshot.length > 10)\n\
{\n\
	internal_continue_execution = false ;\n\
console.log('This loop is being executed too many times, the array is too large')\n\
}\n\
else\n\
	internal_array_monitor.push(to_be_added);" ; 	

end_loop_ast = esprima.parse(end_loop_code); 

global_variables_ast = esprima.parse("internal_continue_execution = true ;internal_array_monitor = [];"); 
}









