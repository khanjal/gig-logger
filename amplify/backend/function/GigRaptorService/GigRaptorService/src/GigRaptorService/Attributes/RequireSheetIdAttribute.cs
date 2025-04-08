using GigRaptorService.Filters;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace GigRaptorService.Attributes;

public class RequireSheetIdAttribute : TypeFilterAttribute
{
    public RequireSheetIdAttribute() : base(typeof(RequireSheetIdFilter))
    {
    }
}
