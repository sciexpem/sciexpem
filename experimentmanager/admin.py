from django.contrib import admin

# Register your models here.

from .models import ChemModel

admin.site.register(ChemModel)