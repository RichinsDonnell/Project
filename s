/*console.log("somethings wrong")

	/* get the program code */ 
	program = "var a = 0 ;\narray = [];\nwhile(a < 4 )\n{\n\tarray[a] = a+1;\n}" ; 
		
	/* location data for different constructs in the source code */ 
	var block_statements = [] ; 	
	var while_statements = [] ; 

	

	/* parse the script and append code to the end of all necessary block satememts*/ 
	esprima.parseScript(program , {} , function (node , meta)
	{

		if(node.type === "BlockStatement")
		{
			block_statements.push({start : meta.start.offset , end : meta.end.offset});	
		}	
		
		
	} );

	console.log("Original Code:")
	console.log(program)
	console.log("")

	var end_block_code = "internal_array_monitor.push(array.splice(0)); \n\
if(internal_array_monitor.length > 10)\n\
{\n\
	internal_continue_execution = false ;\n\
console.log('This loop is being executed too many times, the array is too large')\n\
}\n" ; 		

	program = program.slice(0 , block_statements[0].end - 1 ) + end_block_code + program.slice(block_statements[0].end -1 ); 
	console.log("Modified Code:")
	//console.log(program);

	/* parse the script and modify all while loops*/ 
	esprima.parseScript(program , {} , function (node , meta)
	{
	
		if(node.type === "WhileStatement")
		{
			while_statements.push({start : meta.start.offset , end : meta.end.offset});	
		}
	} );

	var while_statement = program.slice(while_statements[0].start , while_statements[0].end ) ;
	var header_length = while_statement.indexOf("{")
	var while_statement_header = while_statement.slice(0, header_length); 
	
	while_statement_header = while_statement_header.slice(0, while_statement_header.indexOf("(") +1) + "(" /* everything upto the header */ 
					+  while_statement_header.slice(while_statement_header.indexOf("(") +1 , while_statement_header.lastIndexOf(")") -1) /* everything that was in the header before*/ 	
						+ ") && (internal_continue_execution === true)" /*boolean expression to add */ 
							+ ")" ; /* end header right bracket */  

	while_statement = while_statement_header + while_statement.slice(header_length);
	program  = program.slice(0 , while_statements[0].start - 1 ) + while_statement + program.slice(while_statements[0].end ); 
 

	/* add global variable declaration to the beginning of the code */ 
	program = "internal_continue_execution = true ;\ninternal_array_monitor = [];\n "+ program ;  


	console.log(program);

