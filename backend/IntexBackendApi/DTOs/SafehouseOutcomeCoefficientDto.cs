namespace IntexBackendApi.DTOs;

public class SafehouseOutcomeCoefficientDto
{
    public long      Id         { get; set; }
    public DateOnly? RunDate    { get; set; }
    public string?   Feature    { get; set; }
    public decimal?  BetaHealth { get; set; }
    public decimal?  SeHealth   { get; set; }
    public decimal?  PHealth    { get; set; }
    public string?   SigHealth  { get; set; }
    public decimal?  BetaEdu    { get; set; }
    public decimal?  SeEdu      { get; set; }
    public decimal?  PEdu       { get; set; }
    public string?   SigEdu     { get; set; }
}
