# main/urls.py
from django.urls import path
from .views import create_agent, agent_configs, create_task, stop_runner

urlpatterns = [
    path('create-agent/', create_agent, name='create-agent'),
    path('create-task/', create_task, name='create-task'),
    path('agent_configs/', agent_configs, name='agent_configs'),
    path('stop_runner/', stop_runner, name='stop_runner'),
]
