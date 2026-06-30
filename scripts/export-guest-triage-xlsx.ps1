param(
  [string]$SourceCsv = 'output\convites\convidados-triagem.csv',
  [string]$TargetXlsx = 'output\convites\convidados-triagem.xlsx'
)

$ErrorActionPreference = 'Stop'

$columns = @(
  'origem',
  'linha_origem',
  'nome_original',
  'nome_convidado',
  'id_familia_sugerido',
  'nome_familia_sugerido',
  'telefone_whatsapp',
  'e_crianca',
  'e_responsavel_familia',
  'status_revisao',
  'observacoes'
)

$sourcePath = (Resolve-Path -LiteralPath $SourceCsv).Path
$targetPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($TargetXlsx)
$rows = Import-Csv -LiteralPath $sourcePath

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
  $workbook = $excel.Workbooks.Add()
  $sheet = $workbook.Worksheets.Item(1)
  $sheet.Name = 'triagem'

  for ($c = 0; $c -lt $columns.Count; $c++) {
    $sheet.Cells.Item(1, $c + 1).Value2 = $columns[$c]
  }

  for ($r = 0; $r -lt $rows.Count; $r++) {
    for ($c = 0; $c -lt $columns.Count; $c++) {
      $value = [string]$rows[$r].$($columns[$c])
      $sheet.Cells.Item($r + 2, $c + 1).Value2 = $value
    }
  }

  $used = $sheet.UsedRange
  $used.Font.Name = 'Calibri'
  $used.Font.Size = 11
  $sheet.Rows.Item(1).Font.Bold = $true
  $sheet.Rows.Item(1).Interior.Color = 14277081
  $sheet.Columns.AutoFit() | Out-Null
  $sheet.Application.ActiveWindow.SplitRow = 1
  $sheet.Application.ActiveWindow.FreezePanes = $true

  if (Test-Path -LiteralPath $targetPath) {
    Remove-Item -LiteralPath $targetPath -Force
  }

  $workbook.SaveAs($targetPath, 51)
  $workbook.Close($true)
} finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

Get-Item -LiteralPath $targetPath | Select-Object FullName, Length, LastWriteTime
