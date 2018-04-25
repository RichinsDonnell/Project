

paper.install(window);
window.addEventListener("load" , onWindowLoad); 

array_to_monitor = "array"; 

var element_to_animate;
var element_to_animate_from ; 
var element_to_animate_to;  

function onWindowLoad()
{
	paper.setup('myCanvas');
	unpause = false ; 
	generateAst(); 
	
	
	/*?!??!?!?!?!?!?!!?!?!?!?!!?!? Uncomment ONE of the following 'program' variables */
	
	// #Uncomment the line below to see visualizations of the heterogeneous array growing , and being modified  
	//program = "var a = 1 ;array = []; array.push(100); while((a < 200) ) { if(a===2) array.push('String test'); if(a===3)array.push('A String') ; array.push(a) ;array[a] =array[a-1] ;a++; }  " ; 		// #insertion sort --- Uncomment the line below to see visualizations of an insertion sort algorithm
	program = "var array = [54, 26, 93, 17, 77, 31,  44, 55] ;var i = 0 ; while( i  < array.length) { let value = array[i]; var j = i -1 ; while (j > -1 && array[j] > value){ array[j + 1] = array[j] ; j-- ; }  array[j + 1]= value ; i++ ; } console.log(array)"; 


	/* generate abstract syntax tree */ 
	ast = esprima.parse(program); 
	
	console.log("User Entered Code:"); 
	console.log(astring.generate(ast)); 	
	
	/* add global variables that hold the snapshot of the array */ 
	ast.body = global_variables_ast.body.concat(ast.body)
	
	/* recursively walk the ast, modifying it where necessary. This is where the code is analysed and necessary code is added in  */ 
	r_walk(ast);

	/* generate a javascript program from the ast */ 
	var modified_program = astring.generate(ast) ; 
	console.log("Internally Generated Code:"); 
	console.log(modified_program); 
	eval(modified_program); 
	showVisualization(); 
	view.onFrame = frame ;
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
			case "WhileStatement":
				/* change the test */ 
				
				let new_test = esprima.parse("(" + astring.generate(node[i].test)+ ") && (internal_continue_execution === true) ").body[0] ; // esprima.parse returna aprogram			
				node[i].test = new_test.expression ; 
				
				
				/* look for assignments (computed member expression) */
				for(j in node[i].body.body)
				{
					
					
					element = node[i].body.body[j]; 
							
					if(element.type === "ExpressionStatement")
					{
						if(element.expression.type === "AssignmentExpression" )
						{
							operation = determineOperationType(element.expression);
							if(operation.type === "MOVE")
							{
								//console.log("move from: ", operation.assignment.right_property , "to:" , operation.assignment.left_property )
								var move_code = "move = {from:"+operation.assignment.right_property +" , to : " + operation.assignment.left_property + "};" ;
								 								
								
								var move_ast = esprima.parse(move_code); 
								
								//console.log(move_ast.body) 
								node[i].body.body.splice(j+1, 0 , move_ast.body[0]); 
								 
							}
						}
					}
					
				}

				
				/* add the end_loop code */ 
				//if(level === 0 )
				//{
					if(node[i].body.type === "BlockStatement")
					{
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
				
			}
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
	
	context = document.getElementById("myCanvas").getContext('2d'); 
	
	var fontSize = 12; 
	var cellPadding = 4;  	
	
	
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
			var cell_width = 20 ; 	
			
			if(typeof element.snapshot[i] === "undefined" || element.snapshot[i]=== null)
			{
				text = new PointText(new Point(i*22 + 11 , 0 ) ); 
				text.content = "-"; 
			}	
			else
			{
				string = element.snapshot[i].toString() ;
				if(string.length > 1)
					cell_width = context.measureText(string).width + 4*cellPadding 	; 				
		
				let x = current_length + cellPadding ; 
				let y = fontSize  ; 
				
				text = new PointText(new Point(x ,y ))
				text.content = string ; 
				
			}

			text.fillColor = "black" ;
			text.fontSize = fontSize ;  

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

		
	
		if( element.move.to )
		{
			var to = element.move.to ; 
			var from = element.move.from	 ; 
			element_to_move = children.children.filter(obj => obj.constructor.name === "PointText" )[from]; 
			element_to_animate = element_to_move ;
	
			console.log(element_to_animate)
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

		
		
		
			/* draw arrow */ 
			var arrow = new Path(); 
			arrow.add(new Point(from_x , j*30-1)); 
			arrow.add(new Point(to_x, j*30-1)) ; 
			arrow.add(new Point(to_x - 5 , j*30-5)) 
			arrow.strokeColor = "green"
		
		
		
	
		}
		else 
			console.log("No move detected"); 
		
		
		var array = new CompoundPath( children);
			
		array.strokeColor = "black" ; 
		array.strokeWidth = 2 ;
		array.miterLimit= 1 ; 

			

		array.translate(new Point(0 , j*30)) ; 

			
	}
	
	view.draw(); 		

}

function frame()
{
	if(element_to_animate)
	{
		console.log(element_to_animate)
	 
	}
	
	
}





function makeCell(width=20 ,  closed=false )
{                                                        
	var cell = new Path(); 
	cell.add(new Point(0, 0 ));
	cell.add(new Point(0 , 20)); 
	cell.add(new Point(width , 20));	

	/* the last box in an array representation */ 
	var end_cell = cell.clone(); 
	end_cell.add(new Point(width, 0)); 

	return (closed) ? cell : end_cell ; 
	
}


function generateAst()
{
	var end_loop_code = "let to_be_added = {snapshot: array.slice(0), move : move}	; \n\
if(to_be_added.snapshot.length > 10)\n\
{\n\
	internal_continue_execution = false ;\n\
console.log('This loop is being executed too many times, the array is too large')\n\
}\n\
else\n\
	internal_array_monitor.push(to_be_added); " ; 	

end_loop_ast = esprima.parse(end_loop_code); 

global_variables_ast = esprima.parse("internal_continue_execution = true ;internal_array_monitor = []; move = {};"); 
}









