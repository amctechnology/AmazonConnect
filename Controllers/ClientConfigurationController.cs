using ConnectApp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ConnectApp.Controllers
{
  public class ClientConfigurationController : Controller
  {
    private ClientConfiguration clientConfig;

    public ClientConfigurationController(IOptions<ClientConfiguration> clientConfigOptions)
    {
      clientConfig = clientConfigOptions?.Value;
    }

    [HttpGet]
    public IActionResult Index()
    {
      return Json(clientConfig);
    }
  }
}
