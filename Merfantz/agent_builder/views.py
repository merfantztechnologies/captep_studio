from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import re

@api_view(['POST'])
def create_agent(request):
    """
    Receives JSON data from UI and processes it.
    Returns a success message if processed successfully.

    sample request ->
    {
        "workflow_id": "1234567890",
        "researcher": {
            "role": "{topic} Senior Data Researcher",
            "goal": "Uncover cutting-edge developments in {topic}",
            "backstory": "You're a seasoned researcher with a knack for uncovering the latest developments in {topic}. Known for your ability to find the most relevant information and present it in a clear and concise manner."
        }
    }

    response ->
    {
        "success": true,
        "message": "Agent created and processed successfully.",
        "workflow_id": "8c55e4e0-a0e5-464f-8d89-d24b3f722ecc"
    }

    """
    #-------------------------------------
    from main import agent_datas
    #-------------------------------------
    try:

        print("-------------API-1(step-1) --> Agent Data Received-------------------")
        data = request.data 
        agent_datas(data)
        #print(data)
        print("-------------API-1(step - 5) --> Completed-------------------")

        #return Response(status=status.HTTP_200_OK)
        return Response({
            "success": True,
            "message": "Agent created and processed successfully.",
            "workflow_id": data.get("workflow_id")
        }, status=status.HTTP_200_OK)

    except Exception as e:
        # Return a 400 Bad Request if something goes wrong
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def create_task(request):
    """
    Receives JSON data from UI and processes it.
    Returns a success message if processed successfully.

    sample response:
    ->
    {
        "researcher_task": {
            "description": "Conduct a thorough research about {topic}. Make sure you find any interesting and relevant information given. the current year is 2025.",
            "expected_output": "A list with 10 bullet points of the most relevant information about {topic}",
            "agent": "researcher"
        },
        "reporting_task": {
            "description": "Review the context you got and expand each topic into a full section for a report. Make sure the report is detailed and contains any and all relevant information.",
            "expected_output": "A fully fledge reports with the mains topics, each with a full section of information. Formatted as markdown without.",
            "agent": "reporting_analyst",
            "markdown": "True",
            "output_file": "report.md"
        }
    }

    response ->
    {
        "success": true,
        "message": "Agent created and processed successfully.",
        "workflow_id": "8c55e4e0-a0e5-464f-8d89-d24b3f722ecc"
    }
    """
    #-------------------------------------
    from main import task_datas
    #-------------------------------------
    try:
        print("-------------API-2(step-1) --> Task Data Received-------------------")
        data = request.data 
        task_datas(data)
        print("-------------API-2(step - 5) --> Completed-------------------")

        #return Response(status=status.HTTP_200_OK)
        return Response({
            "success": True,
            "message": "Task created and processed successfully.",
            "workflow_id": data.get("workflow_id")
        }, status=status.HTTP_200_OK)

    except Exception as e:
        # Return a 400 Bad Request if something goes wrong
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def agent_configs(request):
    """
    Receives agent configuration JSON from UI and processes it.
    """
    #-------------------------------------
    from main import create_python_runner
    #-------------------------------------

    try:
        data = request.data
        # workflow_id = data.get("workflow_id")

        # if not workflow_id:
        #     return Response({"error": "workflow_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        print("***************************************")
        print(data)
        print("***************************************")

        try:
            print("-------------API-3(step-1) --> JSON DATA CONTENT received - started-------------------")
            result = create_python_runner(data) 
            print("Python File creation for the workflow ended") 

        except Exception as py_error:
            print(f'Error While creating python runner file --- {py_error}')

        # result = start_runner_for_workflow(workflow_id, path_runner)
        # print("Workflow started:", json.dumps(result, indent=4))

        return Response({
            "message": "Runner started successfully",
            "details": result
        }, status=status.HTTP_200_OK)

        #return Response({"message": "Agent configs received successfully"}, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def stop_runner(request):
    from agent_builder.utils.process_manager import stop_runner_for_workflow
    workflow_id = request.data.get("workflow_id")
    if not workflow_id:
        return Response({"error": "workflow_id is required"}, status=status.HTTP_400_BAD_REQUEST)

    result = stop_runner_for_workflow(workflow_id)
    return Response(result)
