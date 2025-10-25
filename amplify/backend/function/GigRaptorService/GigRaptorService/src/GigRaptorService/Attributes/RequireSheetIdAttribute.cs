using GigRaptorService.Filters;
using Microsoft.AspNetCore.Mvc;

namespace GigRaptorService.Attributes;

public class RequireSheetIdAttribute : TypeFilterAttribute
{
    public RequireSheetIdAttribute() : base(typeof(RequireSheetIdFilter))
    {
    }
}
